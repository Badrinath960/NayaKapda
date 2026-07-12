import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCustomerAuth } from '@/lib/middleware';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', color: '#111827', fontSize: 10, lineHeight: 1.5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: '#e5e7eb', paddingBottom: 20, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#f97316' },
  meta: { textAlign: 'right' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 4, marginBottom: 8, color: '#f97316' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  bold: { fontWeight: 'bold' },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 6, marginBottom: 6, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 6, marginBottom: 6 },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: 'center' },
  col3: { flex: 1, textAlign: 'right' },
  col4: { flex: 1.5, textAlign: 'right' },
  totalSection: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 10, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4, width: 200 },
  grandTotal: { fontSize: 12, fontWeight: 'bold', color: '#f97316' },
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40, textAlign: 'center', color: '#9ca3af', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10, fontSize: 8 },
});

interface InvoiceProps {
  order: any;
}

const InvoiceDocument: React.FC<InvoiceProps> = ({ order }) => {
  const formatDate = (d: any) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const formatINR = (v: number) => `Rs. ${Number(v).toLocaleString('en-IN')}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>NayaKapda</Text>
            <Text>Bulk Apparel Platform</Text>
            <Text>Mumbai, Maharashtra, India</Text>
            <Text>Email: support@nayakapda.com</Text>
          </View>
          <View style={styles.meta}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>INVOICE</Text>
            <Text>Invoice No: NK-{order.id.slice(-8).toUpperCase()}</Text>
            <Text>Date: {formatDate(order.createdAt)}</Text>
            <Text>Payment Mode: {order.paymentMode}</Text>
            <Text>Status: {order.status}</Text>
          </View>
        </View>

        {/* Addresses */}
        <View style={{ flexDirection: 'row', gap: 20, marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.bold}>{order.user.name || 'Valued Customer'}</Text>
            <Text>Phone: {order.user.phone}</Text>
            {order.user.email && <Text>Email: {order.user.email}</Text>}
          </View>
          {order.address && (
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Ship To</Text>
              <Text style={styles.bold}>{order.address.name}</Text>
              <Text>{order.address.line1}</Text>
              <Text>{order.address.city}, {order.address.state} {order.address.pincode}</Text>
              <Text>{order.address.country}</Text>
            </View>
          )}
        </View>

        {/* Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Product / SKU</Text>
            <Text style={styles.col2}>Size</Text>
            <Text style={styles.col2}>Color</Text>
            <Text style={styles.col2}>Qty</Text>
            <Text style={styles.col3}>Price</Text>
            <Text style={styles.col4}>Amount</Text>
          </View>
          {order.items.map((item: any) => (
            <View key={item.id} style={styles.tableRow}>
              <View style={styles.col1}>
                <Text style={styles.bold}>{item.variant.product.name}</Text>
                <Text style={{ color: '#6b7280', fontSize: 8 }}>SKU: {item.variant.sku}</Text>
              </View>
              <Text style={styles.col2}>{item.variant.size}</Text>
              <Text style={styles.col2}>{item.variant.color}</Text>
              <Text style={styles.col2}>{item.qty}</Text>
              <Text style={styles.col3}>{formatINR(Number(item.unitPrice))}</Text>
              <Text style={styles.col4}>{formatINR(Number(item.subtotal))}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={{ flex: 1, color: '#4b5563' }}>Subtotal:</Text>
            <Text style={[styles.col3, styles.bold]}>{formatINR(Number(order.subtotal))}</Text>
          </View>
          {Number(order.discountAmount) > 0 && (
            <View style={styles.totalRow}>
              <Text style={{ flex: 1, color: '#10b981' }}>Discount:</Text>
              <Text style={[styles.col3, styles.bold, { color: '#10b981' }]}>-{formatINR(Number(order.discountAmount))}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={{ flex: 1, color: '#4b5563' }}>Shipping:</Text>
            <Text style={[styles.col3, styles.bold]}>{formatINR(Number(order.shippingCost))}</Text>
          </View>
          <View style={[styles.totalRow, { marginTop: 5 }]}>
            <Text style={{ flex: 1, fontWeight: 'bold' }}>Grand Total:</Text>
            <Text style={[styles.col3, styles.grandTotal]}>{formatINR(Number(order.totalAmount))}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for your business with NayaKapda!</Text>
          <Text>This is a computer-generated invoice and does not require a physical signature.</Text>
        </View>
      </Page>
    </Document>
  );
};

export const GET = withCustomerAuth(async (request: NextRequest, context: { params: { id: string } }, session) => {
  const id = context.params.id;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { variant: { include: { product: true } } } },
      address: true,
      user: true,
    },
  });

  if (!order || order.userId !== session.userId) {
    return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
  }

  const stream = await renderToStream(<InvoiceDocument order={order} />);

  // Convert stream to a buffer to send in response
  const chunks: any[] = [];
  for await (const chunk of stream as any) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Invoice-${order.id.slice(-8).toUpperCase()}.pdf"`,
    },
  });
});
