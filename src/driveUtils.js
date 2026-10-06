import JSZip from "jszip";
import { saveAs } from "file-saver";

export const getOrCreateFolder = async (folderName, accessToken) => {
  // Check if folder exists
  const query = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`);
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!searchRes.ok) {
    if (searchRes.status === 401) throw new Error("SESSION_EXPIRED");
    throw new Error("Failed to search folder");
  }
  const data = await searchRes.json();

  if (data.files && data.files.length > 0) {
    return data.files[0].id; // Return existing folder ID
  }

  // Create folder if not exists
  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });

  if (!createRes.ok) {
    if (createRes.status === 401) throw new Error("SESSION_EXPIRED");
    throw new Error("Failed to create folder");
  }
  const newData = await createRes.json();
  return newData.id;
};

export const uploadToDrive = (file, accessToken, folderId = null, onProgress = null) => {
  return new Promise((resolve, reject) => {
    const metadata = {
      name: file.name,
      mimeType: file.type
    };
    
    if (folderId) {
      metadata.parents = [folderId];
    }

    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,thumbnailLink,webContentLink,iconLink");
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent, event.loaded, event.total);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (e) {
          reject(new Error("Failed to parse upload response"));
        }
      } else {
        if (xhr.status === 401) {
          reject(new Error("SESSION_EXPIRED"));
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error("Network error during file upload"));
    xhr.send(form);
  });
};

export const fetchDriveFile = async (fileId, accessToken) => {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!res.ok) {
      if (res.status === 401) throw new Error("SESSION_EXPIRED");
      throw new Error("Download failed");
  }

  return await res.blob();
};

export const downloadZip = async (assets, accessToken) => {
  const zip = new JSZip();

  for (const asset of assets) {
    if (!asset.driveId) continue;
    const blob = await fetchDriveFile(asset.driveId, accessToken);
    zip.file(asset.name, blob);
  }

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "flowgen-assets.zip");
};
