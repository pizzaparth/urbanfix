import api from '../services/api.js';

export const downloadReceipt = async (trackingId) => {
  try {
    const response = await api.get(`/complaints/download-receipt/${trackingId}`, {
      responseType: 'blob',
    });
    const fileUrl = window.URL.createObjectURL(new Blob([response.data]));
    const fileLink = document.createElement('a');
    fileLink.href = fileUrl;
    fileLink.setAttribute('download', `Resolution_Receipt_${trackingId}.pdf`);
    document.body.appendChild(fileLink);
    fileLink.click();
    fileLink.remove();
  } catch (err) {
    alert('Failed to download resolution receipt.');
  }
};
