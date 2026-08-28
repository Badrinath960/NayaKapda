import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cloudinary } from '@/lib/cloudinary';
import { withAdminAuth } from '@/lib/middleware';

// PATCH /api/admin/products/[id]/photos/[photoId] — update altText or sortOrder
export const PATCH = withAdminAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string; photoId: string }> }
) => {
  const { id, photoId } = await context.params;

  const photo = await prisma.productPhoto.findFirst({
    where: { id: photoId, productId: id },
  });
  if (!photo) {
    return NextResponse.json({ success: false, message: 'Photo not found' }, { status: 404 });
  }

  const body = await request.json();
  const data: { altText?: string; sortOrder?: number } = {};
  if (typeof body.altText === 'string') data.altText = body.altText;
  if (typeof body.sortOrder === 'number') data.sortOrder = body.sortOrder;

  const updated = await prisma.productPhoto.update({
    where: { id: photoId },
    data,
  });

  return NextResponse.json({ success: true, data: updated });
});

// DELETE /api/admin/products/[id]/photos/[photoId] — delete photo from DB + Cloudinary
export const DELETE = withAdminAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string; photoId: string }> }
) => {
  const { id, photoId } = await context.params;

  const photo = await prisma.productPhoto.findFirst({
    where: { id: photoId, productId: id },
  });
  if (!photo) {
    return NextResponse.json({ success: false, message: 'Photo not found' }, { status: 404 });
  }

  // Delete from Cloudinary if publicId is stored
  if (photo.publicId) {
    try {
      await cloudinary.uploader.destroy(photo.publicId);
    } catch (err) {
      // Log but don't fail — still delete from DB
      console.error('[Cloudinary] Failed to delete asset:', photo.publicId, err);
    }
  }

  await prisma.productPhoto.delete({ where: { id: photoId } });

  return NextResponse.json({ success: true });
});
