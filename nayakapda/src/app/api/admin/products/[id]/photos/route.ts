import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cloudinary } from '@/lib/cloudinary';
import { withAdminAuth } from '@/lib/middleware';
import { Readable } from 'stream';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// GET /api/admin/products/[id]/photos — list all photos for a product
export const GET = withAdminAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;

  const photos = await prisma.productPhoto.findMany({
    where: { productId: id },
    orderBy: { sortOrder: 'asc' },
  });

  return NextResponse.json({ success: true, data: photos });
});

// POST /api/admin/products/[id]/photos — upload a new photo
export const POST = withAdminAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;

  // Verify product exists
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
  }

  // Parse multipart form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({
      success: false,
      message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
    }, { status: 400 });
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({
      success: false,
      message: 'File too large. Maximum size is 5 MB.',
    }, { status: 400 });
  }

  // Check photo limit (max 8 per product)
  const existingCount = await prisma.productPhoto.count({ where: { productId: id } });
  if (existingCount >= 8) {
    return NextResponse.json({
      success: false,
      message: 'Maximum 8 photos per product. Please delete an existing photo first.',
    }, { status: 400 });
  }

  const altText = (formData.get('altText') as string) || product.name;

  // Upload to Cloudinary
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const uploadResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `nayakapda/products/${id}`,
        resource_type: 'image',
        transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'));
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    );

    const readable = Readable.from(buffer);
    readable.pipe(uploadStream);
  });

  // Determine sort order (append at end)
  const maxOrder = await prisma.productPhoto.aggregate({
    where: { productId: id },
    _max: { sortOrder: true },
  });
  const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  // Save to DB
  const photo = await prisma.productPhoto.create({
    data: {
      productId: id,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      altText,
      sortOrder,
    },
  });

  return NextResponse.json({ success: true, data: photo }, { status: 201 });
});
