import { ArchiveItem } from './types';

let SPREADSHEET_ID = localStorage.getItem('user_spreadsheet_id') || '19tho4TXU6FYQ7ofw1f5E2ZEaIzJu7wb9P6wjRQDSIT';
let DRIVE_FOLDER_ID = localStorage.getItem('user_drive_folder_id') || '1NHjhUxJHm6P__IwUp87KZdX4l9VE4bns';

export function getSpreadsheetId(): string {
  return SPREADSHEET_ID;
}

export function getDriveFolderId(): string {
  return DRIVE_FOLDER_ID;
}

// Helper to handle API fetch and common errors
async function fetchGoogleApi(url: string, token: string, options: RequestInit = {}) {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || response.statusText;
    throw new Error(`Google API Error: ${message} (Status: ${response.status})`);
  }

  return response.json();
}

export interface SheetMetadata {
  title: string;
  sheetId: number;
}

// 1. Get spreadsheet info to resolve first sheet's title and ID dynamically
export async function getSpreadsheetDetails(token: string): Promise<SheetMetadata> {
  const data = await fetchGoogleApi(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`,
    token
  );
  
  if (!data.sheets || data.sheets.length === 0) {
    throw new Error('Spreadsheet tidak memiliki lembar halaman (sheet).');
  }

  const firstSheetProperties = data.sheets[0].properties;
  return {
    title: firstSheetProperties.title,
    sheetId: firstSheetProperties.sheetId,
  };
}

// 1.5 Setup Workspace (search/create folder & spreadsheet)
export async function setupWorkspace(token: string): Promise<{ spreadsheetId: string; driveFolderId: string }> {
  try {
    console.log('setupWorkspace: Memulai pengecekan workspace...');
    
    // 1. Get or create folder
    let folderId = localStorage.getItem('user_drive_folder_id');
    let folderQueryMatches = false;

    if (folderId) {
      try {
        const metadata = await fetchGoogleApi(`https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,trashed`, token);
        if (metadata && !metadata.trashed) {
          folderQueryMatches = true;
        }
      } catch (err) {
        console.warn('setupWorkspace: Folder terdaftar tidak bisa diakses, abaikan dan cari ulang:', err);
      }
    }

    if (!folderQueryMatches) {
      // Find folder named 'Arsip Digital Folder'
      const folderQuery = "name = 'Arsip Digital Folder' and mimeType = 'application/vnd.google-apps.folder' and trashed = false";
      const searchRes = await fetchGoogleApi(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(folderQuery)}&fields=files(id,name)`,
        token
      );

      if (searchRes.files && searchRes.files.length > 0) {
        folderId = searchRes.files[0].id;
        console.log('setupWorkspace: Folder ditemukan:', folderId);
      } else {
        // Create new folder
        console.log('setupWorkspace: Membuat folder baru di Google Drive');
        const createRes = await fetchGoogleApi(
          'https://www.googleapis.com/drive/v3/files',
          token,
          {
            method: 'POST',
            body: JSON.stringify({
              name: 'Arsip Digital Folder',
              mimeType: 'application/vnd.google-apps.folder'
            })
          }
        );
        folderId = createRes.id;
        console.log('setupWorkspace: Folder baru berhasil dibuat:', folderId);
      }

      if (folderId) {
        localStorage.setItem('user_drive_folder_id', folderId);
        DRIVE_FOLDER_ID = folderId;
      }
    }

    // 2. Get or create Spreadsheet
    let spreadsheetId = localStorage.getItem('user_spreadsheet_id');
    let sheetQueryMatches = false;

    if (spreadsheetId) {
      try {
        await fetchGoogleApi(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, token);
        sheetQueryMatches = true;
      } catch (err) {
        console.warn('setupWorkspace: Spreadsheet terdaftar tidak bisa diakses, abaikan dan cari ulang:', err);
      }
    }

    if (!sheetQueryMatches) {
      // Find spreadsheet named 'Arsip Digital Database'
      const sheetQuery = "name = 'Arsip Digital Database' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false";
      const searchRes = await fetchGoogleApi(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(sheetQuery)}&fields=files(id,name)`,
        token
      );

      if (searchRes.files && searchRes.files.length > 0) {
        spreadsheetId = searchRes.files[0].id;
        console.log('setupWorkspace: Spreadsheet ditemukan:', spreadsheetId);
      } else {
        // Create new Spreadsheet
        console.log('setupWorkspace: Membuat spreadsheet baru di Google Drive');
        const createRes = await fetchGoogleApi(
          'https://www.googleapis.com/drive/v3/files',
          token,
          {
            method: 'POST',
            body: JSON.stringify({
              name: 'Arsip Digital Database',
              mimeType: 'application/vnd.google-apps.spreadsheet',
              parents: folderId ? [folderId] : []
            })
          }
        );
        spreadsheetId = createRes.id;
        console.log('setupWorkspace: Spreadsheet baru berhasil dibuat:', spreadsheetId);

        // Initialize header
        try {
          const details = await fetchGoogleApi(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, token);
          const firstSheetTitle = details.sheets?.[0]?.properties?.title || 'Sheet1';
          const range = `${firstSheetTitle}!A1:K1`;
          await fetchGoogleApi(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
            token,
            {
              method: 'PUT',
              body: JSON.stringify({
                values: [HEADERS]
              })
            }
          );
          console.log('setupWorkspace: Inisialisasi header berhasil.');
        } catch (initErr) {
          console.error('setupWorkspace: Gagal menginisialisasi headers pada spreadsheet baru:', initErr);
        }
      }

      if (spreadsheetId) {
        localStorage.setItem('user_spreadsheet_id', spreadsheetId);
        SPREADSHEET_ID = spreadsheetId;
      }
    }

    return {
      spreadsheetId: SPREADSHEET_ID,
      driveFolderId: DRIVE_FOLDER_ID
    };
  } catch (error: any) {
    console.error('setupWorkspace: Terjadi kesalahan:', error);
    // If it fails, we fall back to use default/existing IDs as a last resort
    return {
      spreadsheetId: SPREADSHEET_ID,
      driveFolderId: DRIVE_FOLDER_ID
    };
  }
}

// Constants for sheet headers
const HEADERS = [
  'ID',
  'Nomor Arsip',
  'Judul Dokumen',
  'Kategori',
  'Deskripsi',
  'Tanggal Arsip',
  'File Drive ID',
  'File Drive Link',
  'File Name',
  'Pengunggah',
  'Tanggal Unggah',
];

// Helper to convert sheet row to ArchiveItem
function rowToArchiveItem(row: string[], index: number): ArchiveItem {
  return {
    id: row[0] || `row-${index}`,
    nomorArsip: row[1] || '',
    judul: row[2] || '',
    kategori: row[3] || '',
    deskripsi: row[4] || '',
    tanggalArsip: row[5] || '',
    fileDriveId: row[6] || '',
    fileDriveLink: row[7] || '',
    fileDriveName: row[8] || '',
    pengunggah: row[9] || '',
    tanggalUnggah: row[10] || '',
  };
}

// Helper to convert ArchiveItem to sheet row
function archiveItemToRow(item: ArchiveItem): string[] {
  return [
    item.id,
    item.nomorArsip,
    item.judul,
    item.kategori,
    item.deskripsi,
    item.tanggalArsip,
    item.fileDriveId,
    item.fileDriveLink,
    item.fileDriveName,
    item.pengunggah,
    item.tanggalUnggah,
  ];
}

// 2. Load all archives from the spreadsheet
export async function fetchArchives(token: string): Promise<ArchiveItem[]> {
  const { title } = await getSpreadsheetDetails(token);
  const range = `${title}!A1:K1000`; // Fetch first 1000 records
  
  try {
    const data = await fetchGoogleApi(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}`,
      token
    );

    const rows = data.values as string[][] | undefined;

    // If completely empty or missing headers, initialize the sheet
    if (!rows || rows.length === 0) {
      await initializeSheetWithHeaders(token, title);
      return [];
    }

    // Check if the first row is headers. If not, verify if we need to write headers
    const firstRowIsEmptyOrDiff = rows[0] && rows[0][0] !== 'ID';
    if (firstRowIsEmptyOrDiff) {
      // Re-initialize headers
      await initializeSheetWithHeaders(token, title);
      return [];
    }

    // Map starting from index 1 to skip headers
    const archives: ArchiveItem[] = [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i] && rows[i][0]) { // Ensure ID exists
        archives.push(rowToArchiveItem(rows[i], i + 1));
      }
    }

    return archives;
  } catch (error) {
    console.error('Gagal mengambil data arsip dari Google Sheets:', error);
    throw error;
  }
}

// 3. Initialize Spreadsheet with Columns if empty or broken
async function initializeSheetWithHeaders(token: string, sheetTitle: string) {
  const range = `${sheetTitle}!A1:K1`;
  await fetchGoogleApi(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    token,
    {
      method: 'PUT',
      body: JSON.stringify({
        values: [HEADERS],
      }),
    }
  );
}

// 4. Create an archive entry (Google Sheets append)
export async function createArchiveEntry(token: string, item: ArchiveItem): Promise<void> {
  const { title } = await getSpreadsheetDetails(token);
  const range = `${title}!A:K`;
  
  const rowData = archiveItemToRow(item);

  await fetchGoogleApi(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        values: [rowData],
      }),
    }
  );
}

// 5. Update an archive entry (Google Sheets PUT to specific row)
export async function updateArchiveEntry(token: string, item: ArchiveItem): Promise<void> {
  const { title } = await getSpreadsheetDetails(token);
  
  // To find the exact row, we fetch the range A1:A1000 to search for the ID
  const idRange = `${title}!A1:A1000`;
  const data = await fetchGoogleApi(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(idRange)}`,
    token
  );

  const ids = data.values as string[][] | undefined;
  if (!ids) throw new Error('Format spreadsheet tidak valid, ID kolom tidak ditemukan.');

  const rowIndex = ids.findIndex(row => row && row[0] === item.id);
  if (rowIndex === -1) {
    throw new Error(`Data arsip dengan ID '${item.id}' tidak ditemukan di spreadsheet.`);
  }

  // Row index is 0-based in array, representing (rowIndex + 1) in Sheets.
  // Sheets is 1-indexed. e.g. index 3 means row 4
  const rowNum = rowIndex + 1;
  const updateRange = `${title}!A${rowNum}:K${rowNum}`;

  await fetchGoogleApi(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(updateRange)}?valueInputOption=USER_ENTERED`,
    token,
    {
      method: 'PUT',
      body: JSON.stringify({
        values: [archiveItemToRow(item)],
      }),
    }
  );
}

// 6. Delete an archive entry (Google Sheets delete row dimension)
export async function deleteArchiveEntry(token: string, itemId: string): Promise<void> {
  const { title, sheetId } = await getSpreadsheetDetails(token);

  // First find the Row Index
  const idRange = `${title}!A1:A1000`;
  const data = await fetchGoogleApi(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(idRange)}`,
    token
  );

  const ids = data.values as string[][] | undefined;
  if (!ids) throw new Error('Kolom ID tidak ditemukan.');

  const rowIndex = ids.findIndex(row => row && row[0] === itemId);
  if (rowIndex === -1) {
    throw new Error(`Data arsip dengan ID '${itemId}' tidak ditemukan.`);
  }

  // Delete matching row dimension.
  // Note: deleteDimension expects 0-indexed range where startIndex is inclusive and endIndex is exclusive.
  await fetchGoogleApi(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      }),
    }
  );
}

// 7. Upload physical file to Google Drive folder
export async function uploadFileToDrive(
  token: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ fileId: string; fileLink: string }> {
  try {
    const boundary = '-------314159265358979323846';
    const delimiter = `--${boundary}\r\n`;
    const close_delim = `\r\n--${boundary}--`;

    const metadata = {
      name: file.name,
      parents: [DRIVE_FOLDER_ID],
    };

    const metadataPart = 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata);
    const mediaPartHeader = `Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`;

    const multipartBlob = new Blob([
      delimiter,
      metadataPart,
      `\r\n${delimiter}`,
      mediaPartHeader,
      file,
      close_delim
    ], { type: `multipart/related; boundary=${boundary}` });

    // Call multipart upload API using real multipart/related with binary concatenation
    const responseData = await fetchGoogleApi(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      token,
      {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBlob,
      }
    );

    const fileId = responseData.id;
    // Fallback to constructed alternate link if webViewLink is not returned
    const fileLink = responseData.webViewLink || `https://drive.google.com/file/d/${fileId}/view?usp=drivesdk`;

    return { fileId, fileLink };
  } catch (error) {
    console.error('Gagal mengunggah file ke Google Drive:', error);
    throw error;
  }
}

// 8. Delete file from Google Drive (Send to Trash or completely delete)
export async function deleteFileFromDrive(token: string, fileId: string): Promise<void> {
  if (!fileId) return;
  try {
    // Instead of raw DELETE, let's update files metadata to set trashed: true (safer and standard practice)
    await fetchGoogleApi(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      token,
      {
        method: 'PATCH',
        body: JSON.stringify({
          trashed: true,
        }),
      }
    );
  } catch (error) {
    console.error(`Gagal menghapus/menghas-sampahkan file dari Google Drive (${fileId}):`, error);
    // Silent catch if the file doesn't exist or is already deleted
  }
}
