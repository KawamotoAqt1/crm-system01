-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_area_id_fkey";

-- AlterTable
ALTER TABLE "employees" ALTER COLUMN "area_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
