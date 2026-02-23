import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '@/lib/currency';

interface BookingData {
  id: string;
  created_at: string;
  total_price: number;
  passenger_count: number;
  travel_date: string | null;
  guest_name?: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;
  payment_status?: string;
  tracking_status?: string;
  packages: {
    title: string;
    type: string;
    duration_days: number;
    price?: number;
  };
}

const statusLabels: Record<string, string> = {
  order_submitted: 'Order Submitted',
  documents_received: 'Documents Received',
  under_review: 'Under Review',
  approved: 'Approved',
  processing: 'Processing',
  completed: 'Completed',
};

const paymentLabels: Record<string, string> = {
  pending: 'Payment Pending',
  pending_cash: 'Cash on Arrival',
  pending_verification: 'Verifying Payment',
  paid: 'Paid',
  emi_pending: 'EMI Plan Active',
  failed: 'Payment Failed',
};

export const generateBookingPDF = (booking: BookingData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const primaryColor: [number, number, number] = [34, 97, 51]; // Green
  const secondaryColor: [number, number, number] = [100, 100, 100];
  
  let yPos = 20;

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('S. M. Elite Hajj Limited', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Your Trusted Hajj & Umrah Partner', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('BOOKING RECEIPT', pageWidth / 2, yPos, { align: 'center' });

  yPos = 55;

  // Booking Reference Section
  doc.setTextColor(0, 0, 0);
  doc.setFillColor(245, 245, 245);
  doc.rect(14, yPos, pageWidth - 28, 25, 'F');
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...secondaryColor);
  doc.text('Booking ID', 20, yPos);
  doc.text('Booking Date', pageWidth / 2, yPos);
  
  yPos += 7;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(booking.id.slice(0, 8).toUpperCase(), 20, yPos);
  doc.text(new Date(booking.created_at).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }), pageWidth / 2, yPos);

  yPos += 14;

  // Customer Details (if available)
  if (booking.guest_name || booking.guest_email || booking.guest_phone) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Customer Details', 14, yPos);
    
    yPos += 6;
    
    const customerData: [string, string][] = [];
    if (booking.guest_name) customerData.push(['Name', booking.guest_name]);
    if (booking.guest_email) customerData.push(['Email', booking.guest_email]);
    if (booking.guest_phone) customerData.push(['Phone', booking.guest_phone]);

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: customerData,
      theme: 'plain',
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40, textColor: secondaryColor },
        1: { cellWidth: 'auto' },
      },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 6;
  }

  // Package Details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Package Details', 14, yPos);
  
  yPos += 6;

  const perPersonPrice = booking.packages.price || Math.round(booking.total_price / booking.passenger_count);
  
  const packageData: [string, string][] = [
    ['Package Name', booking.packages.title],
    ['Type', booking.packages.type.charAt(0).toUpperCase() + booking.packages.type.slice(1)],
    ['Duration', `${booking.packages.duration_days} Days`],
    ['Travel Date', booking.travel_date 
      ? new Date(booking.travel_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'To be confirmed'],
    ['Passengers', `${booking.passenger_count} person(s)`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: packageData,
    theme: 'striped',
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50, textColor: secondaryColor },
      1: { cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 8;

  // Payment Summary
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Payment Summary', 14, yPos);
  
  yPos += 6;

  const formatPDFCurrency = (amount: number) => `Tk ${amount.toLocaleString("en-BD")}`;

  const paymentData: [string, string][] = [
    ['Price Per Person', formatPDFCurrency(perPersonPrice)],
    ['Number of Passengers', booking.passenger_count.toString()],
    ['Total Amount', formatPDFCurrency(booking.total_price)],
    ['Payment Status', paymentLabels[booking.payment_status || 'pending'] || 'Pending'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: paymentData,
    theme: 'striped',
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60, textColor: secondaryColor },
      1: { cellWidth: 'auto', halign: 'right' },
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      // Make total amount bold
      if (data.row.index === 2 && data.column.index === 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 12;
        data.cell.styles.textColor = primaryColor;
      }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 8;

  // Status
  if (booking.tracking_status) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Booking Status', 14, yPos);
    
    yPos += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(statusLabels[booking.tracking_status] || booking.tracking_status, 14, yPos);
    
    yPos += 10;
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 35;
  
  doc.setFillColor(...primaryColor);
  doc.rect(0, footerY, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Thank you for choosing S. M. Elite Hajj Limited!', pageWidth / 2, footerY + 10, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('For any queries, please contact us:', pageWidth / 2, footerY + 18, { align: 'center' });
  doc.text('Phone: +8801867666888 | Email: info@smelitehajj.com', pageWidth / 2, footerY + 25, { align: 'center' });

  // Save the PDF
  const fileName = `Booking_Receipt_${booking.id.slice(0, 8).toUpperCase()}.pdf`;
  doc.save(fileName);
};
