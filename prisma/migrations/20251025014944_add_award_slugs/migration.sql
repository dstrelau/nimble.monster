-- AlterTable
ALTER TABLE "awards" ADD COLUMN "slug" TEXT, ADD COLUMN "description" TEXT;
UPDATE awards SET slug = 'nim-1' WHERE abbreviation = 'Nim+ 1';
UPDATE awards SET slug = 'nim-2' WHERE abbreviation = 'Nim+ 2';
UPDATE awards SET slug = 'nim-3' WHERE abbreviation = 'Nim+ 3';
UPDATE awards SET slug = 'jam-3' WHERE abbreviation = 'Jam 3';
ALTER TABLE "awards" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "awards_slug_key" ON "awards"("slug");
