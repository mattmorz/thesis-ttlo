import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import { google } from "googleapis";

const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";

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

type ServiceAccountCredentials = {
  client_email?: string;
  private_key?: string;
};

let driveAuthClientPromise:
  | Promise<InstanceType<typeof google.auth.JWT>>
  | null = null;

function getDriveServiceAccountJsonPath() {
  return process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim() || null;
}

function getDriveServiceAccountJsonInline() {
  return process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON?.trim() || null;
}

function getDriveRootFolderId() {
  return process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID?.trim() || null;
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

async function loadServiceAccountCredentials() {
  const inlineJson = getDriveServiceAccountJsonInline();
  if (inlineJson) {
    try {
      return JSON.parse(inlineJson) as ServiceAccountCredentials;
    } catch {
      throw new DriveAuthError(
        "GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON is not valid JSON."
      );
    }
  }

  const credentialsPath = getDriveServiceAccountJsonPath();
  if (!credentialsPath) {
    throw new DriveAuthError(
      "Set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON file path or provide GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON."
    );
  }

  try {
    const raw = await readFile(credentialsPath, "utf8");
    return JSON.parse(raw) as ServiceAccountCredentials;
  } catch (error) {
    throw new DriveAuthError(
      `Failed to load the Google service account JSON from ${credentialsPath}.`
    );
  }
}

async function getDriveAuthClient() {
  if (!driveAuthClientPromise) {
    driveAuthClientPromise = (async () => {
      const credentials = await loadServiceAccountCredentials();
      if (!credentials.client_email || !credentials.private_key) {
        throw new DriveAuthError(
          "The service account JSON must include client_email and private_key."
        );
      }

      const client = new google.auth.JWT(
        credentials.client_email,
        undefined,
        credentials.private_key,
        [DRIVE_SCOPE]
      );
      await client.authorize();
      return client;
    })();
  }

  return driveAuthClientPromise;
}

async function getDriveAccessToken() {
  const authClient = await getDriveAuthClient();
  const accessToken = await authClient.getAccessToken();
  const token =
    typeof accessToken === "string" ? accessToken : accessToken?.token;

  if (!token) {
    throw new DriveAuthError(
      "Google Drive access token could not be generated from the service account."
    );
  }

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
    throw new Error(`Drive folder lookup failed: ${text || response.status}`);
  }

  const data = (await response.json()) as {
    files?: Array<{ id: string; name: string }>;
  };

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
    throw new Error(`Drive folder create failed: ${text || response.status}`);
  }

  const data = (await response.json()) as { id?: string };
  if (!data.id) {
    throw new Error("Drive folder create did not return a folder ID.");
  }

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
      "GOOGLE_DRIVE_ROOT_FOLDER_ID is required. Share the target Drive folder with the service account email from the JSON key."
    );
  }

  let parentId = rootFolderId;

  for (const segment of pathSegments) {
    const safeName = sanitizeDriveName(segment);
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
    if (uploadResponse.status === 401 || uploadResponse.status === 403) {
      throw new DriveAuthError(
        "Google Drive authorization expired. Please reconnect your Drive."
      );
    }
    throw new Error(`Drive upload failed: ${text || uploadResponse.status}`);
  }

  const data = (await uploadResponse.json()) as {
    id?: string;
    webViewLink?: string;
    webContentLink?: string;
  };

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
    if (permissionResponse.status === 401 || permissionResponse.status === 403) {
      throw new DriveAuthError(
        "Google Drive authorization expired. Please reconnect your Drive."
      );
    }
    throw new Error(
      `Failed to set Drive permission: ${text || permissionResponse.status}`
    );
  }

  return {
    fileId: data.id,
    webViewLink: data.webViewLink,
    webContentLink: data.webContentLink,
  };
}
