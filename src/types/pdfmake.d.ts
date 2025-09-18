declare module "pdfmake/build/pdfmake";
declare module "pdfmake/build/vfs_fonts";

export {};

declare global {
  interface Window {
    updateIPFormStatus?: (
      formName: string,
      completed: boolean,
      applicationId: string
    ) => void;
    _apiRequestsInProgress?: Record<string, boolean>;
    _clientProfileFetchInProgress?: Record<string, boolean>;
  }
}
