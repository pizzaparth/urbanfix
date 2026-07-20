import PDFDocument from 'pdfkit';

export const generateResolutionPdf = (complaint) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // 1. Header Layout
      doc
        .fillColor('#0d6efd')
        .fontSize(20)
        .text('SMART DIGITAL COMPLAINT MANAGEMENT SYSTEM', { align: 'center' })
        .moveDown(0.2);

      doc
        .fillColor('#666666')
        .fontSize(10)
        .text('Public Transparency & Municipal Administration Portal', { align: 'center' })
        .moveDown(1.5);

      // Horizontal separator line
      doc
        .strokeColor('#e0e0e0')
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown(1.5);

      // 2. Title & Tracking Card
      doc
        .fillColor('#333333')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('COMPLAINT RESOLUTION RECEIPT')
        .moveDown(0.8);

      // Metadata fields table structure
      doc.fontSize(11).font('Helvetica');
      
      const drawRow = (label, value) => {
        const currentY = doc.y;
        doc.font('Helvetica-Bold').fillColor('#555555').text(label, 50, currentY, { width: 150 });
        doc.font('Helvetica').fillColor('#222222').text(value || 'N/A', 200, currentY, { width: 350 });
        doc.moveDown(0.5);
      };

      drawRow('Tracking ID:', complaint.trackingId);
      drawRow('Category:', complaint.category);
      drawRow('Subject:', complaint.title);
      drawRow('Filing Date:', new Date(complaint.createdAt).toLocaleDateString());
      drawRow('Resolution Date:', new Date().toLocaleDateString());
      drawRow('Current Status:', complaint.status);

      doc.moveDown(1);

      // Section Separator
      doc
        .strokeColor('#f0f0f0')
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown(1);

      // 3. Complaint Description
      doc
        .font('Helvetica-Bold')
        .fillColor('#333333')
        .fontSize(12)
        .text('Citizen Description:')
        .moveDown(0.4);

      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#555555')
        .text(complaint.description, { width: 500, align: 'justify' })
        .moveDown(1.5);

      // 4. Resolution Remarks
      doc
        .font('Helvetica-Bold')
        .fillColor('#198754') // Green themed resolution header
        .fontSize(12)
        .text('Official Resolution Remarks:')
        .moveDown(0.4);

      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#222222')
        .text(complaint.remarks || 'No remarks provided.', { width: 500, align: 'justify' })
        .moveDown(2);

      // 5. Official Signature Placeholder
      doc
        .strokeColor('#cccccc')
        .lineWidth(0.5)
        .moveTo(350, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown(0.4);

      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#333333')
        .text('Authorized Municipal Commissioner', 350, doc.y, { align: 'center', width: 200 })
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#777777')
        .text('Digital Signature Verified', { align: 'center', width: 200 });

      // Page footer positioning
      doc
        .fontSize(8)
        .fillColor('#aaaaaa')
        .text(
          'This is a system-generated document. Security claims can be verified using the Tracking ID on our public portal.',
          50,
          750,
          { align: 'center', width: 500 }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
