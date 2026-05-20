import { Routes, Route, Navigate } from "react-router-dom";
import ApplicationListPage from "./pages/ApplicationListPage";
import ApplicationDetailPage from "./pages/ApplicationDetailPage";
import ApplicationFormPage from "./pages/ApplicationFormPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ApplicationListPage />} />
      <Route path="/applications/new" element={<ApplicationFormPage />} />
      <Route path="/applications/:id" element={<ApplicationDetailPage />} />
      <Route path="/applications/:id/edit" element={<ApplicationFormPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
