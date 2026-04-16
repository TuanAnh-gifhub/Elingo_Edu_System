import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  teacherService,
  type TeacherVerificationResponse,
} from "../../../services/teachers/teacherService";
import { useAuth } from "../../../context/AuthContext";

type FormState = {
  fullName: string;
  phone: string;
  bio: string;
  expertise: string;
  experience: string;
  portfolioLink: string;
};

const INITIAL_FORM: FormState = {
  fullName: "",
  phone: "",
  bio: "",
  expertise: "",
  experience: "",
  portfolioLink: "",
};

const TeacherVerificationPage = () => {
  const { user, isAuthenticated, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [certificateFiles, setCertificateFiles] = useState<string[]>([]);
  const [myRequest, setMyRequest] = useState<TeacherVerificationResponse | null>(
    null,
  );

  useEffect(() => {
    const loadMyRequest = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const request = await teacherService.getMyVerificationRequest();
        setMyRequest(request);
      } catch (error: unknown) {
        const status =
          typeof error === "object" &&
          error !== null &&
          "response" in error &&
          (error as { response?: { status?: number } }).response?.status
            ? (error as { response?: { status?: number } }).response!.status!
            : 0;

        if (status !== 404) {
          const message =
            typeof error === "object" &&
            error !== null &&
            "response" in error &&
            (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
              ? (
                  error as {
                    response?: { data?: { message?: string } };
                  }
                ).response!.data!.message!
              : "Không thể tải trạng thái xác minh.";
          setErrorMessage(message);
        }
      } finally {
        setLoading(false);
      }
    };

    loadMyRequest();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName || user.userName || "",
      phone: prev.phone || user.phone || "",
    }));
  }, [user]);

  const statusView = useMemo(() => {
    if (!myRequest) {
      return null;
    }

    if (myRequest.status === "PENDING") {
      return {
        className: "bg-amber-50 border-amber-200 text-amber-700",
        title: "Đang chờ duyệt",
        description: "Yêu cầu của bạn đang được admin xem xét.",
      };
    }

    if (myRequest.status === "APPROVED") {
      return {
        className: "bg-emerald-50 border-emerald-200 text-emerald-700",
        title: "Bạn đã là giáo viên",
        description: "Tài khoản của bạn đã được nâng cấp thành TEACHER.",
      };
    }

    return {
      className: "bg-rose-50 border-rose-200 text-rose-700",
      title: "Đã bị từ chối",
      description: myRequest.adminNote || "Yêu cầu bị từ chối.",
    };
  }, [myRequest]);

  const handleInputChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUploadCertificate = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    try {
      setUploading(true);
      const uploadTasks = Array.from(fileList).map((file) =>
        teacherService.uploadCertificate(file),
      );
      const uploadedUrls = await Promise.all(uploadTasks);

      setCertificateFiles((prev) => [...prev, ...uploadedUrls]);
      setSuccessMessage(`Đã upload ${uploadedUrls.length} file chứng chỉ.`);
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message
          ? (
              error as {
                response?: { data?: { message?: string } };
              }
            ).response!.data!.message!
          : "Upload chứng chỉ thất bại.";
      setErrorMessage(message);
    } finally {
      setUploading(false);
    }
  };

  const removeCertificate = (url: string) => {
    setCertificateFiles((prev) => prev.filter((file) => file !== url));
  };

  const handleSubmit = async () => {
    if (!form.fullName.trim() || !form.bio.trim() || !form.expertise.trim() || !form.experience.trim()) {
      setErrorMessage("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }

    if (certificateFiles.length === 0) {
      setErrorMessage("Vui lòng upload ít nhất một chứng chỉ.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const request = await teacherService.submitVerificationRequest({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        bio: form.bio.trim(),
        expertise: form.expertise.trim(),
        experience: form.experience.trim(),
        certificateFiles,
        portfolioLink: form.portfolioLink.trim() || undefined,
      });

      setMyRequest(request);
      await refreshProfile();
      setSuccessMessage("Gửi yêu cầu xác minh giáo viên thành công.");
      setForm(INITIAL_FORM);
      setCertificateFiles([]);
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message
          ? (
              error as {
                response?: { data?: { message?: string } };
              }
            ).response!.data!.message!
          : "Không thể gửi yêu cầu vào lúc này.";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-8">Đang tải...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Xác minh giáo viên</h1>
        <p className="text-sm text-slate-500 mt-1">
          Tất cả tài khoản mới mặc định là STUDENT. Gửi yêu cầu để nâng cấp thành TEACHER.
        </p>
      </div>

      {statusView ? (
        <div className={`rounded-xl border p-4 ${statusView.className}`}>
          <p className="font-semibold">{statusView.title}</p>
          <p className="text-sm mt-1">{statusView.description}</p>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {myRequest?.status === "PENDING" || myRequest?.status === "APPROVED" ? null : (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={form.fullName}
              onChange={(event) => handleInputChange("fullName", event.target.value)}
              placeholder="Họ và tên"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={user.email}
              disabled
              placeholder="Email"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            />
            <input
              value={form.phone}
              onChange={(event) => handleInputChange("phone", event.target.value)}
              placeholder="Số điện thoại"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={form.portfolioLink}
              onChange={(event) => handleInputChange("portfolioLink", event.target.value)}
              placeholder="Portfolio/LinkedIn (không bắt buộc)"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <textarea
            value={form.bio}
            onChange={(event) => handleInputChange("bio", event.target.value)}
            placeholder="Giới thiệu ngắn gọn"
            rows={3}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />

          <textarea
            value={form.expertise}
            onChange={(event) => handleInputChange("expertise", event.target.value)}
            placeholder="Chuyên môn / kỹ năng"
            rows={3}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />

          <textarea
            value={form.experience}
            onChange={(event) => handleInputChange("experience", event.target.value)}
            placeholder="Kinh nghiệm giảng dạy"
            rows={4}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />

          <div className="rounded-xl border border-slate-200 p-3 space-y-2">
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={(event) => {
                handleUploadCertificate(event.target.files);
                event.target.value = "";
              }}
            />
            <p className="text-xs text-slate-500">Hỗ trợ JPG/PNG/WebP/PDF. Tối đa 10MB mỗi file.</p>
            {uploading ? <p className="text-xs text-sky-700">Đang upload...</p> : null}
            {certificateFiles.length > 0 ? (
              <ul className="space-y-1">
                {certificateFiles.map((url, index) => (
                  <li key={`${url}-${index}`} className="flex items-center justify-between gap-2 text-sm">
                    <a href={url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline break-all">
                      Chứng chỉ {index + 1}
                    </a>
                    <button
                      type="button"
                      onClick={() => removeCertificate(url)}
                      className="text-rose-600 hover:underline"
                    >
                      Xóa
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || uploading}
            className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "Đang gửi..." : "Gửi yêu cầu xác minh"}
          </button>
        </div>
      )}
    </div>
  );
};

export default TeacherVerificationPage;

