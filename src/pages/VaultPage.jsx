import React, { useState, useContext, useEffect } from 'react';
import { TransactionContext } from '../context/TransactionContext';

// Base URL for decryption API call
const API_DECRYPT_BASE = 'http://localhost:5000/api/vault/decrypt'; 
const API_ENCRYPTED_BASE = 'http://localhost:5000/api/vault/encrypted';

const VaultPage = () => {
  const { files, getFiles, uploadFile, isLoading, error } = useContext(TransactionContext);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  
  // Fetch file list on component load
  useEffect(() => {
    getFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handler for file upload (Encryption on server)
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadStatus('Please select a file first.');
      return;
    }

    setUploadStatus('Uploading and Encrypting...');

    const formData = new FormData();
    formData.append('file', selectedFile); 

    const success = await uploadFile(formData);
    if (success) {
      setUploadStatus('Upload successful! File encrypted in the Vault.');
      setSelectedFile(null); 
      document.getElementById('file-input').value = null; 
    } else {
      // Error message will be populated by context
      setUploadStatus(`Upload failed. Check error message.`);
    }
  };

  // Handler for file download (Decryption on server)
  const handleFileDownload = (fileId, fileName) => {
    const token = JSON.parse(localStorage.getItem('user')).token;
    const url = `${API_DECRYPT_BASE}/${fileId}`;

    setUploadStatus(`Decrypting and preparing ${fileName}...`);

    fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Use the original filename for the download
        return response.blob();
    })
    .then(blob => {
        // Create a temporary URL for the binary blob and trigger download
        const href = window.URL.createObjectURL(blob);
        const a = Object.assign(document.createElement('a'), {
            href,
            style: 'display:none',
            download: fileName,
        });
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(href);
        setUploadStatus('Decryption and download complete.');
    })
    .catch(err => {
        console.error('Download error:', err);
        setUploadStatus(`Decryption failed: ${err.message}`);
    });
  };
  
  const handleDownloadEncrypted = (fileId, fileName) => {
    const token = JSON.parse(localStorage.getItem('user')).token;
    const url = `${API_ENCRYPTED_BASE}/${fileId}`;

    // Use a standard GET request to download the raw binary file
    fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
    })
    .then(response => response.blob())
    .then(blob => {
        const href = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = href;
        // Name the file clearly so the user knows what to re-upload
        a.download = `ENCRYPTED_${fileName}.enc`; 
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(href);
    })
    .catch(err => {
        console.error('Download error:', err);
        setUploadStatus('Error downloading encrypted file.');
    });
  };


  // Reusable styles for the table (defined here for simplicity)
  const tableHeaderStyle = { padding: '12px 24px', textAlign: 'left', fontSize: '12px', color: '#555', borderBottom: '2px solid #EEE' };
  const tableHeaderStyleRight = { ...tableHeaderStyle, textAlign: 'right' };
  const tableCellStyle = { padding: '12px 24px', fontSize: '14px', color: '#333' };
  const tableCellStyleRight = { ...tableCellStyle, textAlign: 'right' };


  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px' }}>🔐 Secure Vault</h2>
      
      <div style={{ padding: '20px', border: '1px solid #DDD', borderRadius: '8px', marginBottom: '30px', backgroundColor: '#F9FAFB' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>Upload & Encrypt File</h3>
        
        <form onSubmit={handleFileUpload} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <input 
            type="file" 
            id="file-input"
            onChange={(e) => setSelectedFile(e.target.files[0])} 
            accept="image/*,application/pdf"
            required
            style={{ padding: '8px', border: '1px solid #CCC', borderRadius: '4px' }}
          />
          <button 
            type="submit" 
            disabled={isLoading}
            style={{ 
              backgroundColor: '#4CAF50', // Green
              color: 'white', 
              padding: '10px 15px', 
              borderRadius: '6px', 
              cursor: 'pointer',
              border: 'none',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            {isLoading ? 'Encrypting...' : 'Encrypt & Upload'}
          </button>
        </form>
        {uploadStatus && <p style={{ marginTop: '10px', color: (uploadStatus.includes('failed') || uploadStatus.includes('Error')) ? 'red' : 'green' }}>{uploadStatus}</p>}
        {error && <p style={{ color: 'red' }}>Vault Error: {error}</p>}
      </div>

      {/* List of Encrypted Files */}
      <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>Encrypted Files List</h3>
      
      <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#F9FAFB' }}>
            <tr>
              <th style={tableHeaderStyle}>File Name</th>
              <th style={tableHeaderStyle}>Status</th>
              <th style={tableHeaderStyle}>Uploaded</th>
              <th style={tableHeaderStyleRight}>Action</th>
            </tr>
          </thead>
          <tbody>
            {files.length > 0 ? (
              files.map((file) => (
                <tr key={file._id} style={{ borderBottom: '1px solid #EEE' }}>
                  <td style={tableCellStyle}>{file.fileName}</td>
                  <td style={tableCellStyle}><span style={{ color: 'red', fontWeight: 'bold' }}>ENCRYPTED</span></td>
                  <td style={tableCellStyle}>{new Date(file.uploadDate).toLocaleDateString()}</td>
                  <td style={tableCellStyleRight}>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button
                            // Button 1: Download the raw encrypted file
                            onClick={() => handleDownloadEncrypted(file._id, file.fileName)}
                            style={{ 
                                backgroundColor: '#FFC107', // Yellow/Warning color
                                color: '#333', 
                                padding: '8px 12px', 
                                borderRadius: '4px', 
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            Download Encrypted
                        </button>
                
                        {/* The existing Download button can now be relabeled for clarity */}
                        <button
                            onClick={() => handleFileDownload(file._id, file.fileName)}
                            style={{ 
                                backgroundColor: '#007BFF', // Blue color
                                color: 'white', 
                                padding: '8px 12px', 
                                borderRadius: '4px', 
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            Decrypt Original
                        </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '15px', color: '#777' }}>
                  Your Vault is empty. Upload a file above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VaultPage;