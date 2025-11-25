-- Create ImageVersion table and wire it to Image records
CREATE TABLE "ImageVersion" (
    "id" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT,
    "bucket" TEXT,
    "storageDriver" TEXT,
    "format" TEXT,
    "bytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "optimizedUrl" TEXT,
    "optimizedStorageKey" TEXT,
    "thumbnailUrl" TEXT,
    "thumbnailStorageKey" TEXT,
    "metadata" JSONB,
    "parentVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImageVersion_pkey" PRIMARY KEY ("id")
);

-- Extend Image with version tracking metadata
ALTER TABLE "Image" ADD COLUMN "latestVersionId" TEXT;
ALTER TABLE "Image" ADD COLUMN "storageDriver" TEXT;

-- Relationships and indexes
ALTER TABLE "Image" ADD CONSTRAINT "Image_latestVersionId_fkey" FOREIGN KEY ("latestVersionId") REFERENCES "ImageVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ImageVersion" ADD CONSTRAINT "ImageVersion_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImageVersion" ADD CONSTRAINT "ImageVersion_parentVersionId_fkey" FOREIGN KEY ("parentVersionId") REFERENCES "ImageVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "ImageVersion_imageId_idx" ON "ImageVersion"("imageId");
CREATE INDEX "ImageVersion_parentVersionId_idx" ON "ImageVersion"("parentVersionId");
CREATE INDEX "Image_latestVersionId_idx" ON "Image"("latestVersionId");
CREATE UNIQUE INDEX "Image_latestVersionId_key" ON "Image"("latestVersionId");
