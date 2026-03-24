import { randomUUID } from "crypto";
import { db } from "@/drizzle/db";
import { userAccount } from "@/drizzle/migrations/schema";
import { eq } from "drizzle-orm";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_UPLOAD_URL =
  "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink";
const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";

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

async function refreshAccessToken(refreshToken: string) {
  const clientId = process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET;

  if (!clientId || !clientSecret) {
    throw new DriveAuthError("Google OAuth credentials are not configured.");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new DriveAuthError(
      `Failed to refresh Google access token: ${text || response.status}`
    );
  }

  const data = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!data.access_token) {
    throw new DriveAuthError("Google token refresh response missing access.");
  }

  const expiresAt = data.expires_in
    ? new Date(Date.now() + data.expires_in * 1000).toISOString()
    : null;

  return { accessToken: data.access_token, expiresAt };
}

async function getDriveAccessToken(userId: string) {
  const user = await db.query.userAccount.findFirst({
    where: eq(userAccount.id, userId),
    columns: {
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiresAt: true,
    },
  });

  if (!user?.googleRefreshToken) {
    throw new DriveAuthError(
      "Google Drive is not connected for this account. Please reconnect."
    );
  }

  const expiresAt = user.googleTokenExpiresAt
    ? new Date(user.googleTokenExpiresAt).getTime()
    : 0;
  const isValid = user.googleAccessToken && Date.now() < expiresAt - 60_000;

  if (isValid) {
    return user.googleAccessToken as string;
  }

  const refreshed = await refreshAccessToken(user.googleRefreshToken);

  await db
    .update(userAccount)
    .set({
      googleAccessToken: refreshed.accessToken,
      googleTokenExpiresAt: refreshed.expiresAt,
    })
    .where(eq(userAccount.id, userId));

  return refreshed.accessToken;
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
    `${DRIVE_FILES_URL}?q=${encodeURIComponent(
      query
    )}&fields=files(id,name)&pageSize=1`,
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
  const response = await fetch(DRIVE_FILES_URL, {
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
  userId,
  pathSegments,
}: {
  userId: string;
  pathSegments: string[];
}): Promise<DriveFolderResult> {
  const accessToken = await getDriveAccessToken(userId);
  let parentId = "root";

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
  userId,
  file,
  fileName,
  mimeType,
  parentId,
}: {
  userId: string;
  file: File;
  fileName: string;
  mimeType: string;
  parentId?: string;
}): Promise<DriveFileResult> {
  const accessToken = await getDriveAccessToken(userId);
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { body, contentType } = buildMultipartBody(
    parentId ? { name: fileName, parents: [parentId] } : { name: fileName },
    buffer,
    mimeType || "application/octet-stream"
  );

  const uploadResponse = await fetch(DRIVE_UPLOAD_URL, {
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
    `https://www.googleapis.com/drive/v3/files/${data.id}/permissions`,
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
