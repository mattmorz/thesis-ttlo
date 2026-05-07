import { randomUUID } from "crypto";
import { google } from "googleapis";
import { db } from "@/drizzle/db";
import { userAccount } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";
const DRIVE_DEBUG_PREFIX = "[GoogleDrive]";

export const MAX_UPLOAD_SIZE_BYTES = 100 * 1024 * 1024;

export class DriveAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DriveAuthError";
  }
}

type DriveFileResult = {
  fileId: string;
  webViewLink?: string;
  webContentLink?: string;
};

type DriveFolderResult = {
  folderId: string;
};

type DriveStorageAccountCredentials = {
  email: string;
  accessToken: string | null;
  refreshToken: string | null;
  expiryDate: number | null;
};

let driveAuthClientPromise:
  | Promise<InstanceType<typeof google.auth.OAuth2>>
  | null = null;

function logDriveDebug(message: string, details?: Record<string, unknown>) {
  if (details) {
    console.log(DRIVE_DEBUG_PREFIX, message, details);
    return;
  }

  console.log(DRIVE_DEBUG_PREFIX, message);
}

function getDriveRootFolderId() {
  const rawValue = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID?.trim() || null;
  if (!rawValue) {
    return null;
  }

  const folderMatch = rawValue.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch?.[1]) {
    return folderMatch[1];
  }

  return rawValue;
}

function getDriveSharedDriveId() {
  return process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID?.trim() || null;
}

function buildDriveRequestUrl(
  baseUrl: string,
  params: Record<string, string | undefined>
) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }
  const sharedDriveId = getDriveSharedDriveId();
  if (sharedDriveId) {
    searchParams.set("supportsAllDrives", "true");
    searchParams.set("includeItemsFromAllDrives", "true");
  }
  const query = searchParams.toString();
  return query ? `${baseUrl}?${query}` : baseUrl;
}

function buildDriveUploadUrl() {
  return buildDriveRequestUrl(
    "https://www.googleapis.com/upload/drive/v3/files",
    {
      uploadType: "multipart",
      fields: "id,webViewLink,webContentLink",
    }
  );
}

async function getDriveAuthClient() {
  if (!driveAuthClientPromise) {
    driveAuthClientPromise = (async () => {
      logDriveDebug("Creating storage-account Drive auth client");
      const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig();
      const credentials = await loadStorageAccountCredentials();

      const client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri || undefined
      );

      client.setCredentials({
        access_token: credentials.accessToken || undefined,
        refresh_token: credentials.refreshToken || undefined,
        expiry_date: credentials.expiryDate || undefined,
      });

      logDriveDebug("Storage-account Drive client initialized", {
        storageEmail: credentials.email,
        hasAccessToken: Boolean(credentials.accessToken),
        hasRefreshToken: Boolean(credentials.refreshToken),
        expiryDate: credentials.expiryDate || null,
      });

      return client;
    })();
  }

  return driveAuthClientPromise;
}

function getGoogleOAuthConfig() {
  const clientId = process.env.AUTH_GOOGLE_ID?.trim() || null;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET?.trim() || null;
  const redirectUri = process.env.AUTH_GOOGLE_REDIRECT_URI?.trim() || null;

  if (!clientId || !clientSecret) {
    throw new DriveAuthError(
      "AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are required for Drive uploads."
    );
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
}

async function loadStorageAccountCredentials(): Promise<DriveStorageAccountCredentials> {
  const storageEmail = process.env.GOOGLE_DRIVE_STORAGE_EMAIL?.trim() || null;
  if (!storageEmail) {
    throw new DriveAuthError(
      "GOOGLE_DRIVE_STORAGE_EMAIL is required and must point to the Google account that owns the Drive files."
    );
  }

  const record = await db.query.userAccount.findFirst({
    where: eq(userAccount.email, storageEmail),
    columns: {
      email: true,
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiresAt: true,
    },
  });

  if (!record) {
    throw new DriveAuthError(
      `Could not find a user_account row for GOOGLE_DRIVE_STORAGE_EMAIL (${storageEmail}). Sign in with that Google account once so its tokens are stored.`
    );
  }

  if (!record.googleRefreshToken) {
    throw new DriveAuthError(
      `No Google refresh token is stored for ${storageEmail}. Sign out and sign back in with that account after granting Drive access.`
    );
  }

  const expiryDate = record.googleTokenExpiresAt
    ? new Date(record.googleTokenExpiresAt).getTime()
    : null;

  logDriveDebug("Loaded storage account credentials", {
    storageEmail,
    hasAccessToken: Boolean(record.googleAccessToken),
    hasRefreshToken: Boolean(record.googleRefreshToken),
    expiryDate,
  });

  return {
    email: record.email,
    accessToken: record.googleAccessToken,
    refreshToken: record.googleRefreshToken,
    expiryDate,
  };
}

async function getDriveAccessToken() {
  const authClient = await getDriveAuthClient();
  logDriveDebug("Requesting Drive access token");
  const accessToken = await authClient.getAccessToken();
  const token =
    typeof accessToken === "string" ? accessToken : accessToken?.token;

  if (!token) {
    throw new DriveAuthError(
      "Google Drive access token could not be generated from the storage account."
    );
  }

  logDriveDebug("Received Drive access token");
  return token;
}

function buildMultipartBody(
  metadata: Record<string, unknown>,
  fileBuffer: Buffer,
  mimeType: string
) {
  const boundary = `ttlo-${randomUUID()}`;
  const metaPart = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
      metadata
    )}\r\n`
  );
  const fileHeader = Buffer.from(
    `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`
  );
  const footer = Buffer.from(`\r\n--${boundary}--\r\n`);

  return {
    body: Buffer.concat([metaPart, fileHeader, fileBuffer, footer]),
    contentType: `multipart/related; boundary=${boundary}`,
  };
}

function sanitizeDriveName(value: string) {
  const cleaned = value
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > 0 ? cleaned : "Untitled";
}

function escapeDriveQueryValue(value: string) {
  return value.replace(/'/g, "\\'");
}

async function findFolderId({
  accessToken,
  name,
  parentId,
}: {
  accessToken: string;
  name: string;
  parentId: string;
}) {
  const escapedName = escapeDriveQueryValue(name);
  const query = [
    "mimeType='application/vnd.google-apps.folder'",
    `name='${escapedName}'`,
    "trashed=false",
    `'${parentId}' in parents`,
  ].join(" and ");
  logDriveDebug("Searching for Drive folder", {
    name,
    parentId,
    query,
  });

  const response = await fetch(
    buildDriveRequestUrl(DRIVE_FILES_URL, {
      q: query,
      fields: "files(id,name)",
      pageSize: "1",
    }),
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    logDriveDebug("Drive folder lookup failed", {
      name,
      parentId,
      status: response.status,
      responseText: text,
    });
    throw new Error(`Drive folder lookup failed: ${text || response.status}`);
  }

  const data = (await response.json()) as {
    files?: Array<{ id: string; name: string }>;
  };
  logDriveDebug("Drive folder lookup response", {
    name,
    parentId,
    foundId: data.files?.[0]?.id || null,
  });

  return data.files?.[0]?.id ?? null;
}

async function createFolder({
  accessToken,
  name,
  parentId,
}: {
  accessToken: string;
  name: string;
  parentId: string;
}) {
  logDriveDebug("Creating Drive folder", {
    name,
    parentId,
  });
  const response = await fetch(buildDriveRequestUrl(DRIVE_FILES_URL, {}), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    logDriveDebug("Drive folder create failed", {
      name,
      parentId,
      status: response.status,
      responseText: text,
    });
    throw new Error(`Drive folder create failed: ${text || response.status}`);
  }

  const data = (await response.json()) as { id?: string };
  if (!data.id) {
    throw new Error("Drive folder create did not return a folder ID.");
  }

  logDriveDebug("Drive folder created", {
    name,
    parentId,
    folderId: data.id,
  });
  return data.id;
}

async function getOrCreateFolder({
  accessToken,
  name,
  parentId,
}: {
  accessToken: string;
  name: string;
  parentId: string;
}) {
  const existing = await findFolderId({ accessToken, name, parentId });
  if (existing) {
    return existing;
  }

  return createFolder({ accessToken, name, parentId });
}

export async function ensureDriveFolderPath({
  pathSegments,
}: {
  pathSegments: string[];
}): Promise<DriveFolderResult> {
  const accessToken = await getDriveAccessToken();
  const rootFolderId = getDriveRootFolderId();
  if (!rootFolderId) {
    throw new DriveAuthError(
      "GOOGLE_DRIVE_ROOT_FOLDER_ID is required. Share the target Drive folder with the storage account that owns the files."
    );
  }

  logDriveDebug("Ensuring Drive folder path", {
    rootFolderId,
    pathSegments,
  });

  let parentId = rootFolderId;

  for (const segment of pathSegments) {
    const safeName = sanitizeDriveName(segment);
    logDriveDebug("Processing folder path segment", {
      original: segment,
      sanitized: safeName,
      parentId,
    });
    parentId = await getOrCreateFolder({
      accessToken,
      name: safeName,
      parentId,
    });
  }

  return { folderId: parentId };
}

export async function uploadFileToDrive({
  file,
  fileName,
  mimeType,
  parentId,
}: {
  file: File;
  fileName: string;
  mimeType: string;
  parentId?: string;
}): Promise<DriveFileResult> {
  const accessToken = await getDriveAccessToken();
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  logDriveDebug("Uploading file to Drive", {
    fileName,
    mimeType,
    parentId: parentId || null,
    sizeBytes: buffer.length,
  });

  const { body, contentType } = buildMultipartBody(
    parentId ? { name: fileName, parents: [parentId] } : { name: fileName },
    buffer,
    mimeType || "application/octet-stream"
  );

  const uploadResponse = await fetch(buildDriveUploadUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": contentType,
    },
    body,
  });

  if (!uploadResponse.ok) {
    const text = await uploadResponse.text();
    logDriveDebug("Drive upload failed", {
      fileName,
      parentId: parentId || null,
      status: uploadResponse.status,
      responseText: text,
    });
    if (uploadResponse.status === 401 || uploadResponse.status === 403) {
      throw new DriveAuthError(
        `Google Drive upload rejected the request with status ${uploadResponse.status}: ${text || "no response body"}`
      );
    }
    throw new Error(`Drive upload failed: ${text || uploadResponse.status}`);
  }

  const data = (await uploadResponse.json()) as {
    id?: string;
    webViewLink?: string;
    webContentLink?: string;
  };
  logDriveDebug("Drive upload response", {
    fileName,
    fileId: data.id || null,
    hasWebViewLink: Boolean(data.webViewLink),
    hasWebContentLink: Boolean(data.webContentLink),
  });

  if (!data.id) {
    throw new Error("Drive upload did not return a file ID.");
  }

  const permissionResponse = await fetch(
    buildDriveRequestUrl(
      `https://www.googleapis.com/drive/v3/files/${data.id}/permissions`,
      {}
    ),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: "reader",
        type: "anyone",
      }),
    }
  );

  if (!permissionResponse.ok) {
    const text = await permissionResponse.text();
    logDriveDebug("Drive permission update failed", {
      fileId: data.id,
      status: permissionResponse.status,
      responseText: text,
    });
    if (permissionResponse.status === 401 || permissionResponse.status === 403) {
      throw new DriveAuthError(
        `Google Drive permission update rejected the request with status ${permissionResponse.status}: ${text || "no response body"}`
      );
    }
    throw new Error(
      `Failed to set Drive permission: ${text || permissionResponse.status}`
    );
  }

  logDriveDebug("Drive permission update succeeded", {
    fileId: data.id,
  });

  return {
    fileId: data.id,
    webViewLink: data.webViewLink,
    webContentLink: data.webContentLink,
  };
}
