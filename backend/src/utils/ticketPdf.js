import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

/**
 * Generate a PDF ticket as a Buffer
 * @param {Object} booking - Booking details
 * @param {Object} user - User details
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generateTicketPdf(booking, user) {
  // Generate QR code as Data URL (PNG)
  const qrValue = (booking._id ? booking._id.toString() : `${user.email}|${booking.date}`);
  const qrDataUrl = await QRCode.toDataURL(qrValue, { margin: 1, width: 200 });
  // Extract base64
  const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        console.log('[DEBUG] Resolving PDF with length:', pdfData.length);
        resolve(pdfData);
      });

      // Header
      doc.rect(40, 40, 500, 60).fill('#4CAF50');
      doc.fillColor('white').fontSize(28).text('CinemaConnect', 50, 55, { align: 'left' });
      doc.fontSize(16).text('E-Ticket', 50, 85, { align: 'left' });
      doc.fillColor('black');
      doc.moveDown(2);

      // Ticket Body Box
      doc.roundedRect(40, 120, 500, 250, 15).fillOpacity(0.1).fillAndStroke('#ffffff', '#f0f0f0');
      doc.fillOpacity(1);
      doc.fontSize(18).fillColor('#222').text(`${booking.movie && booking.movie.title}`, 60, 140);
      doc.fontSize(12).fillColor('#555').text(`Theater: ${booking.theater && booking.theater.name}`, 60, 170);
      doc.text(`Screen: ${booking.screen && booking.screen.name}`, 60, 190);
      doc.text(`Showtime: ${booking.showtime && booking.showtime.time}`, 60, 210);
      doc.text(`Date: ${booking.date ? new Date(booking.date).toLocaleDateString() : ''}`, 60, 230);
      doc.text(`Seats: ${Array.isArray(booking.seats) ? booking.seats.map(seat => seat.row + seat.number).join(', ') : ''}`, 60, 250);
      doc.text(`Name: ${user.name}`, 60, 270);
      doc.text(`Email: ${user.email}`, 60, 290);
      doc.text(`Booking ID: ${booking._id || ''}`, 60, 310);

      // QR code area
      doc.image(Buffer.from(qrBase64, 'base64'), 420, 150, { width: 100, height: 100 });
      doc.fontSize(10).fillColor('#666').text('Scan for details', 420, 255, { width: 100, align: 'center' });
      doc.moveTo(410, 140).lineTo(410, 360).dash(3, { space: 2 }).stroke('#ccc').undash();

      // Footer
      doc.fontSize(11).fillColor('#4CAF50').text('Please show this ticket at the entrance', 60, 350, { align: 'left' });
      doc.fontSize(10).fillColor('#666').text('Enjoy your movie! — CinemaConnect Team', 60, 370, { align: 'left' });
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
