
// Configuration Key for LocalStorage
const DRIVE_CONFIG_KEY = 'app_drive_config';

interface DriveConfig {
    scriptUrl: string;
}

// Helper to get config
export const getDriveConfig = (): DriveConfig => {
    const stored = localStorage.getItem(DRIVE_CONFIG_KEY);
    return stored ? JSON.parse(stored) : { scriptUrl: '' };
};

export const saveDriveConfig = (config: DriveConfig) => {
    localStorage.setItem(DRIVE_CONFIG_KEY, JSON.stringify(config));
};

export const isDriveConfigured = () => {
    const { scriptUrl } = getDriveConfig();
    return !!scriptUrl;
};

/**
 * Helper: Convert File to Base64
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        // Remove "data:application/pdf;base64," prefix
        const base64 = result.split(',')[1];
        resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

/**
 * Upload a file to Admin's Google Drive via Apps Script Proxy
 */
export const uploadFileToDrive = async (file: File): Promise<{ id: string; webViewLink: string }> => {
  const { scriptUrl } = getDriveConfig();

  // 1. Simulation Mode (if no Script URL configured)
  if (!scriptUrl) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: 'simulated_drive_id_' + Date.now(),
          webViewLink: '#' // Fake link
        });
      }, 1500); // Simulate network delay
    });
  }

  // 2. Real Upload Logic via Apps Script
  try {
      const base64Data = await fileToBase64(file);

      const payload = {
          filename: file.name,
          mimeType: file.type,
          file: base64Data
      };

      // We use 'no-cors' mode initially to test connectivity, but actually needed simple POST.
      // However, Apps Script TextOutput usually requires following redirects.
      // Standard fetch to Apps Script often faces CORS issues if not handled correctly in script.
      // The Script must return ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON);
      
      const response = await fetch(scriptUrl, {
          method: 'POST',
          body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.status === 'error') {
          throw new Error(data.message);
      }

      return {
          id: data.id,
          webViewLink: data.url
      };

  } catch (error) {
    console.error('Error uploading to Drive via Script:', error);
    throw new Error('Gagal upload. Pastikan file tidak melebihi 25MB dan koneksi stabil.');
  }
};
