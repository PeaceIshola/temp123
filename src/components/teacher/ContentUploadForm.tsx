import PDFUpload from "./PDFUpload";
import { Upload } from "lucide-react";

const ContentUploadForm = () => {
  return (
    <PDFUpload
      bucketName="content-pdfs"
      title="Upload Content PDFs"
      description="Upload educational content materials as PDF files"
      icon={<Upload className="h-5 w-5" />}
    />
  );
};

export default ContentUploadForm;