import PDFUpload from "./PDFUpload";
import { BookOpen } from "lucide-react";

const SolutionsForm = () => {
  return (
    <PDFUpload
      bucketName="solution-pdfs"
      title="Upload Solution PDFs"
      description="Upload solution guides and answer keys as PDF files"
      icon={<BookOpen className="h-5 w-5" />}
    />
  );
};

export default SolutionsForm;
