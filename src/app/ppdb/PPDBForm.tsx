"use client";

import { useState, useEffect, useRef } from "react";
import { getErrorMessage } from "@/lib/get-error-message";
import { UnitInformation } from "./UnitInformation";
import { UnitPreview } from "./UnitPreview";
import { UnitBanner } from "./UnitBanner";
import { DocumentField, type UploadStatus, type UploadedDocument } from "./DocumentField";
import type { PPDBUnit } from "./types";

type DocKey = "photo" | "kk" | "akta" | "ijazah";

const fieldClass =
  "w-full rounded-lg border border-gray-300 p-3 text-[16px] focus:border-primary-500 focus:ring-primary-500 md:text-sm";

function Hint({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-1 text-xs text-gray-500">
      {children}
    </p>
  );
}

const emptyDocStatus = (): Record<DocKey, { status: UploadStatus; error?: string }> => ({
  photo: { status: "idle" },
  kk: { status: "idle" },
  akta: { status: "idle" },
  ijazah: { status: "idle" },
});



interface PpdbError {
  message: string;
}

function gradeForUnit(value: string): string {
  if (value === "SMK") return "10";
  if (value === "SMP") return "7";
  if (value === "SD") return "1";
  if (value === "TK") return "TK A";
  if (value === "LPQ") return "Dasar";
  return "";
}

const DEFAULT_UNITS: PPDBUnit[] = [
  { id: 0, name: "LPQ Nuurul Muttaqiin", slug: "lpq", image_url: null, logo_url: null, description: "Lembaga Pendidikan Al-Quran untuk usia dini dan anak-anak." },
  { id: 0, name: "TK Nuurul Muttaqiin", slug: "tk", image_url: null, logo_url: null, description: "Taman Kanak-Kanak Islam Terpadu dengan pendekatan bermain sambil belajar." },
  { id: 0, name: "SD Nuurul Muttaqiin", slug: "sd", image_url: null, logo_url: null, description: "Sekolah Dasar Islam Terpadu yang mengedepankan adab dan ilmu." },
  { id: 0, name: "SMP Nuurul Muttaqiin", slug: "smp", image_url: null, logo_url: null, description: "Sekolah Menengah Pertama dengan program tahfidz unggulan." },
  { id: 0, name: "SMK Nuurul Muttaqiin", slug: "smk", image_url: null, logo_url: null, description: "Sekolah Menengah Kejuruan berwawasan global berlandaskan Islam." },
];

export function PPDBForm({ units, initialUnit = "" }: { units: PPDBUnit[]; initialUnit?: string }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [regNumber, setRegNumber] = useState("");
  
  const [captchaA, setCaptchaA] = useState(0);
  const [captchaB, setCaptchaB] = useState(0);
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const [majors, setMajors] = useState<{id: string, name: string, code?: string}[]>([]);
  const [loadingMajors, setLoadingMajors] = useState(false);
  const [majorsError, setMajorsError] = useState("");
  const majorsRequest = useRef(0);
  const initialPresetApplied = useRef(false);
  const availableUnits = units.length > 0 ? units : DEFAULT_UNITS;
  const requestedCode = initialUnit.toUpperCase();
  const initialCode = availableUnits.some((unit) => unit.slug.toUpperCase() === requestedCode)
    ? requestedCode
    : "";

  useEffect(() => {
    setCaptchaA(Math.floor(Math.random() * 10) + 1);
     
    setCaptchaB(Math.floor(Math.random() * 10) + 1);
  }, []);

  const [formData, setFormData] = useState({
    unit: initialCode,
    grade: gradeForUnit(initialCode),
    major: "",
    student_name: "",
    nisn: "",
    nik: "",
    birth_place: "",
    birth_date: "",
    gender: "Laki-laki",
    religion: "",
    previous_school: "",
    is_pip: "TIDAK",
    address: "",
    father_name: "",
    mother_name: "",
    phone: "",
    email: ""
  });

  const selectedUnit = availableUnits.find((unit) => unit.slug.toUpperCase() === formData.unit) ?? null;

  const [documents, setDocuments] = useState<Partial<Record<DocKey, UploadedDocument>>>({});
  const [docStatus, setDocStatus] = useState(emptyDocStatus);
  const [draft, setDraft] = useState<{ draftId: string; token: string } | null>(null);
  const [docResetNotice, setDocResetNotice] = useState("");

  const selectUnit = (value: string) => {
    if (Object.keys(documents).length > 0) {
      setDocResetNotice("Dokumen direset karena unit berubah. Silakan unggah ulang.");
    }
    setDocuments({});
    setDocStatus(emptyDocStatus());
    setDraft(null);
    setFormData((prev) => ({ ...prev, unit: value, major: "", grade: gradeForUnit(value) }));
    const requestId = ++majorsRequest.current;
    setMajors([]);
    setMajorsError("");

    if (!value) {
      setLoadingMajors(false);
      return;
    }

    setLoadingMajors(true);
    fetch(`/api/ppdb/majors?unit=${encodeURIComponent(value)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat jurusan");
        return res.json();
      })
      .then((data) => {
        if (requestId !== majorsRequest.current) return;
        if (data.success) {
          setMajors(data.data || []);
        } else {
          setMajors([]);
          setMajorsError("Gagal memuat jurusan.");
        }
      })
      .catch((err) => {
        if (requestId !== majorsRequest.current) return;
        console.error("Failed to fetch majors:", err);
        setMajors([]);
        setMajorsError("Gagal memuat jurusan. Periksa koneksi lalu coba lagi.");
      })
      .finally(() => {
        if (requestId === majorsRequest.current) setLoadingMajors(false);
      });
  };

  useEffect(() => {
    if (!initialCode || initialPresetApplied.current) return;
    initialPresetApplied.current = true;
    // Preset from ?unit=SLUG needs the client-side majors fetch.
    selectUnit(initialCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once for the URL preset
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "unit") {
      selectUnit(value);
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const uploadDocument = async (type: DocKey, file: File) => {
    const unit = formData.unit.toLowerCase();
    if (!unit) return;

    setDocResetNotice("");
    setDocStatus((prev) => ({ ...prev, [type]: { status: "uploading" } }));

    try {
      const body = new FormData();
      body.append("file", file);
      body.append("unit", unit);
      body.append("type", type);
      if (draft) {
        body.append("draftId", draft.draftId);
        body.append("token", draft.token);
      }

      const res = await fetch("/api/ppdb/documents", { method: "POST", body });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 403) {
          setDraft(null);
          setDocuments({});
          setDocStatus(emptyDocStatus());
          setDocResetNotice("Sesi upload kedaluwarsa. Silakan unggah ulang dokumen.");
        }
        throw new Error(data.error || "Gagal mengunggah dokumen.");
      }

      setDraft({ draftId: data.draftId, token: data.token });
      setDocuments((prev) => ({
        ...prev,
        [type]: { key: data.key, url: data.url, name: file.name, size: file.size },
      }));
      setDocStatus((prev) => ({ ...prev, [type]: { status: "success" } }));
    } catch (error: unknown) {
      setDocStatus((prev) => ({
        ...prev,
        [type]: { status: "error", error: getErrorMessage(error, "Gagal mengunggah dokumen.") },
      }));
    }
  };

  const removeDocument = (type: DocKey) => {
    setDocuments((prev) => {
      const next = { ...prev };
      delete next[type];
      return next;
    });
    setDocStatus((prev) => ({ ...prev, [type]: { status: "idle" } }));
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);
  const backToUnit = () => {
    setStep(1);
    document.getElementById("ppdb-form")?.scrollIntoView({ block: "start" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch("/api/ppdb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          child_order: 1,
          siblings_count: 0,
          student_photo: documents.photo?.url,
          kk_document: documents.kk?.key,
          birth_cert_document: documents.akta?.key,
          diploma_document: documents.ijazah?.key,
          draftId: draft?.draftId,
          uploadToken: draft?.token,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setSuccessMsg("Pendaftaran berhasil!");
        setRegNumber(data.registration_number);
        setErrorMsg("");
        setStep(6);
      } else {
        if (data.errors && Array.isArray(data.errors)) {
          setErrorMsg(data.message + ": " + data.errors.map((err: PpdbError) => err.message).join(", "));
        } else {
          setErrorMsg(data.message || "Terjadi kesalahan. Silakan coba lagi.");
        }
      }
    } catch (error) {
      setErrorMsg("Terjadi kesalahan sistem. Periksa koneksi internet Anda.");
    } finally {
      setLoading(false);
    }
  };

  const step2Missing = (): string[] => {
    const missing: string[] = [];
    if (formData.student_name.trim().length < 3) missing.push("Nama Lengkap");
    if (formData.birth_place.trim().length < 3) missing.push("Tempat Lahir");
    if (!formData.birth_date) missing.push("Tanggal Lahir");
    if (formData.address.trim().length < 10) missing.push("Alamat Tempat Tinggal");
    if (formData.unit === "SMK") {
      if (!formData.nisn.trim()) missing.push("NISN");
      if (!formData.nik.trim()) missing.push("NIK");
      if (!formData.religion) missing.push("Agama");
      if (!formData.previous_school.trim()) missing.push("Asal Sekolah");
    }
    return missing;
  };

  const step3Missing = (): string[] => {
    const missing: string[] = [];
    if (formData.father_name.trim().length < 3) missing.push("Nama Ayah");
    if (formData.mother_name.trim().length < 3) missing.push("Nama Ibu");
    if (!/^(08|62)\d{8,13}$/.test(formData.phone.trim())) missing.push("No. HP/WhatsApp");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) missing.push("Email");
    return missing;
  };

  return (
    <div id="ppdb-form" className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Progress Bar */}
      {step < 6 && (
        <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex justify-between">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex flex-col items-center">
                <div className={`w-10 h-10 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-sm md:text-sm ${step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {s}
                </div>
              </div>
            ))}
        </div>
      )}

      <div className="p-8">
        {step > 1 && selectedUnit ? (
          <UnitBanner unit={selectedUnit} onChangeUnit={backToUnit} />
        ) : null}

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Pilih Unit & Jenjang</h2>
            
            <div>
              <label htmlFor="unit" className="mb-2 block text-sm font-medium text-gray-700">
                Unit Sekolah Tujuan <span className="text-red-500">*</span>
              </label>
              <select
                id="unit"
                required
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white p-3 text-[16px] focus:border-primary-500 focus:ring-primary-500 md:p-2.5 md:text-sm"
              >
                <option value="">-- Pilih Unit --</option>
                {availableUnits.map((unit) => (
                  <option key={unit.slug} value={unit.slug.toUpperCase()}>
                    {unit.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Kelas awal diisi otomatis sesuai unit yang dipilih.
              </p>
              {docResetNotice ? (
                <p className="mt-1 text-xs text-amber-700" role="status">{docResetNotice}</p>
              ) : null}
            </div>

            <UnitPreview unit={selectedUnit} />
            <UnitInformation unit={formData.unit} />

            {formData.unit && (loadingMajors || majors.length > 0 || majorsError) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Jurusan <span className="text-red-500">*</span></label>
                {majors.length > 0 ? (
                  <select
                    required
                    name="major"
                    value={formData.major}
                    onChange={handleChange}
                    disabled={loadingMajors}
                    className="w-full p-3 md:p-2.5 text-[16px] md:text-sm border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 bg-white"
                  >
                    <option className="text-sm" value="">-- Pilih Jurusan --</option>
                    {majors.map((m) => (
                      <option className="text-sm" key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                ) : null}
                {loadingMajors ? <p className="mt-2 text-sm text-gray-500">Memuat jurusan…</p> : null}
                {majorsError ? (
                  <p className="mt-2 text-sm text-rose-600">
                    {majorsError}{" "}
                    <button
                      type="button"
                      onClick={() => selectUnit(formData.unit)}
                      className="font-semibold underline"
                    >
                      Coba lagi
                    </button>
                  </p>
                ) : null}
              </div>
            )}

            <div className="flex justify-end pt-6">
              <button
                onClick={nextStep}
                disabled={!formData.unit || loadingMajors || !!majorsError || (majors.length > 0 && !formData.major)}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                Selanjutnya &rarr;
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Calon Siswa</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="student_name" className="mb-1 block text-sm font-medium text-gray-700">Nama Lengkap <span className="text-red-500">*</span></label>
                <input id="student_name" type="text" required maxLength={150} autoComplete="name" name="student_name" value={formData.student_name} onChange={handleChange} placeholder="Sesuai akta kelahiran/ijazah" aria-describedby="student_name-hint" className={fieldClass} />
                <Hint id="student_name-hint">3–150 karakter. Tulis sesuai dokumen resmi.</Hint>
              </div>

              {formData.unit === 'SMK' ? (
                <>
                  <div>
                    <label htmlFor="nisn" className="mb-1 block text-sm font-medium text-gray-700">NISN <span className="text-red-500">*</span></label>
                    <input id="nisn" type="text" required maxLength={20} inputMode="numeric" name="nisn" value={formData.nisn} onChange={handleChange} placeholder="Nomor Induk Siswa Nasional" aria-describedby="nisn-hint" className={fieldClass} />
                    <Hint id="nisn-hint">Wajib untuk SMK. Umumnya 10 digit.</Hint>
                  </div>
                  <div>
                    <label htmlFor="nik" className="mb-1 block text-sm font-medium text-gray-700">No. Induk Kependudukan (NIK) <span className="text-red-500">*</span></label>
                    <input id="nik" type="text" required maxLength={16} inputMode="numeric" name="nik" value={formData.nik} onChange={handleChange} placeholder="16 digit sesuai KK" aria-describedby="nik-hint" className={fieldClass} />
                    <Hint id="nik-hint">Wajib untuk SMK. 16 digit sesuai Kartu Keluarga.</Hint>
                  </div>
                </>
              ) : (
                <div>
                  <label htmlFor="nisn-opsional" className="mb-1 block text-sm font-medium text-gray-700">NISN (Opsional)</label>
                  <input id="nisn-opsional" type="text" maxLength={20} inputMode="numeric" name="nisn" value={formData.nisn} onChange={handleChange} placeholder="Nomor Induk Siswa Nasional" aria-describedby="nisn-opsional-hint" className={fieldClass} />
                  <Hint id="nisn-opsional-hint">Isi bila sudah memiliki NISN.</Hint>
                </div>
              )}

              <div>
                <label htmlFor="birth_place" className="mb-1 block text-sm font-medium text-gray-700">Tempat Lahir <span className="text-red-500">*</span></label>
                <input id="birth_place" type="text" required maxLength={100} name="birth_place" value={formData.birth_place} onChange={handleChange} placeholder="Contoh: Garut" aria-describedby="birth_place-hint" className={fieldClass} />
                <Hint id="birth_place-hint">3–100 karakter.</Hint>
              </div>
              <div>
                <label htmlFor="birth_date" className="mb-1 block text-sm font-medium text-gray-700">Tanggal Lahir <span className="text-red-500">*</span></label>
                <input id="birth_date" type="date" required name="birth_date" max={new Date().toISOString().slice(0, 10)} value={formData.birth_date} onChange={handleChange} aria-describedby="birth_date-hint" className={fieldClass} />
                <Hint id="birth_date-hint">Sesuai akta kelahiran/KK.</Hint>
              </div>
              <div>
                <label htmlFor="gender" className="mb-1 block text-sm font-medium text-gray-700">Jenis Kelamin <span className="text-red-500">*</span></label>
                <select id="gender" name="gender" value={formData.gender} onChange={handleChange} className={fieldClass}>
                  <option value="Laki-laki">Laki-Laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              {formData.unit === 'SMK' && (
                <div>
                  <label htmlFor="religion" className="mb-1 block text-sm font-medium text-gray-700">Agama <span className="text-red-500">*</span></label>
                  <select required id="religion" name="religion" value={formData.religion} onChange={handleChange} aria-describedby="religion-hint" className={fieldClass}>
                    <option value="">-- Pilih Agama --</option>
                    <option value="Islam">Islam</option>
                    <option value="Kristen">Kristen</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Konghucu">Konghucu</option>
                  </select>
                  <Hint id="religion-hint">Wajib untuk pendaftar SMK.</Hint>
                </div>
              )}

              <div className="md:col-span-2">
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">Alamat Tempat Tinggal <span className="text-red-500">*</span></label>
                  <span className="text-xs text-gray-400">{formData.address.length}/500</span>
                </div>
                <textarea id="address" required name="address" maxLength={500} value={formData.address} onChange={handleChange} rows={3} placeholder="Jalan, RT/RW, desa/kelurahan, kecamatan, kabupaten" aria-describedby="address-hint" className={fieldClass}></textarea>
                <Hint id="address-hint">Minimal 10 dan maksimal 500 karakter. Sertakan jalan, RT/RW, desa/kelurahan, kecamatan, dan kabupaten.</Hint>
              </div>

              {formData.unit === 'SMK' && (
                <>
                  <div>
                    <label htmlFor="previous_school" className="mb-1 block text-sm font-medium text-gray-700">Asal Sekolah (SMP/MTs) <span className="text-red-500">*</span></label>
                    <input id="previous_school" type="text" required maxLength={200} name="previous_school" value={formData.previous_school} onChange={handleChange} placeholder="Nama SMP/MTs" aria-describedby="previous_school-hint" className={fieldClass} />
                    <Hint id="previous_school-hint">Wajib untuk SMK. Tulis nama sekolah asal.</Hint>
                  </div>
                  <div>
                    <label htmlFor="is_pip" className="mb-1 block text-sm font-medium text-gray-700">Apakah Penerima KPS/PKH/KIP/PIP <span className="text-red-500">*</span></label>
                    <select required id="is_pip" name="is_pip" value={formData.is_pip} onChange={handleChange} aria-describedby="is_pip-hint" className={fieldClass}>
                      <option value="TIDAK">TIDAK</option>
                      <option value="YA">YA</option>
                    </select>
                    <Hint id="is_pip-hint">Pilih YA bila memiliki KPS/PKH/KIP/PIP.</Hint>
                  </div>
                </>
              )}
            </div>

            {step2Missing().length > 0 ? (
              <p className="text-xs text-gray-500">
                Lengkap dulu: {step2Missing().join(", ")}.
              </p>
            ) : null}

            <div className="flex justify-between pt-6 border-t border-gray-100">
              <button onClick={prevStep} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">&larr; Kembali</button>
              <button onClick={nextStep} disabled={step2Missing().length > 0} className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50">Selanjutnya &rarr;</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Orang Tua / Wali</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="father_name" className="mb-1 block text-sm font-medium text-gray-700">Nama Ayah <span className="text-red-500">*</span></label>
                <input id="father_name" type="text" required maxLength={150} autoComplete="name" name="father_name" value={formData.father_name} onChange={handleChange} placeholder="Sesuai KK/KTP" aria-describedby="father_name-hint" className={fieldClass} />
                <Hint id="father_name-hint">3–150 karakter, sesuai Kartu Keluarga/KTP.</Hint>
              </div>
              <div>
                <label htmlFor="mother_name" className="mb-1 block text-sm font-medium text-gray-700">Nama Ibu <span className="text-red-500">*</span></label>
                <input id="mother_name" type="text" required maxLength={150} autoComplete="name" name="mother_name" value={formData.mother_name} onChange={handleChange} placeholder="Sesuai KK/KTP" aria-describedby="mother_name-hint" className={fieldClass} />
                <Hint id="mother_name-hint">3–150 karakter, sesuai Kartu Keluarga/KTP.</Hint>
              </div>
              <div>
                <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">No. HP / WhatsApp Aktif <span className="text-red-500">*</span></label>
                <input id="phone" type="text" required maxLength={20} inputMode="tel" autoComplete="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="081234567890" aria-describedby="phone-hint" className={fieldClass} />
                <Hint id="phone-hint">10–20 digit, diawali 08 atau 62. Pastikan WhatsApp aktif untuk notifikasi panitia.</Hint>
              </div>
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                <input id="email" type="email" required maxLength={255} autoComplete="email" name="email" value={formData.email} onChange={handleChange} placeholder="nama@email.com" aria-describedby="email-hint" className={fieldClass} />
                <Hint id="email-hint">Dipakai untuk mengirim informasi pendaftaran ke alamat ini.</Hint>
              </div>
            </div>

            {step3Missing().length > 0 ? (
              <p className="text-xs text-gray-500">
                Lengkap dulu: {step3Missing().join(", ")}.
              </p>
            ) : null}

            <div className="flex justify-between pt-6 border-t border-gray-100">
              <button onClick={prevStep} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">&larr; Kembali</button>
              <button onClick={nextStep} disabled={step3Missing().length > 0} className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50">Selanjutnya &rarr;</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Dokumen (Opsional)</h2>
            <p className="text-sm text-gray-600">
              Anda dapat mengunggah dokumen pendukung sekarang atau menyusul saat daftar ulang.
              Kosongkan bila belum tersedia.
            </p>
            {docResetNotice ? (
              <p className="text-xs text-amber-700" role="status">{docResetNotice}</p>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DocumentField
                id="doc-photo"
                label="Pas Foto (3x4)"
                hint="JPG/PNG/WebP, maks 1MB. Wajah jelas tanpa tutup kepala."
                accept=".jpg,.jpeg,.png"
                preview
                status={docStatus.photo.status}
                error={docStatus.photo.error}
                file={documents.photo}
                onSelect={(file) => uploadDocument("photo", file)}
                onRemove={() => removeDocument("photo")}
              />
              <DocumentField
                id="doc-kk"
                label="Kartu Keluarga (KK)"
                hint="PDF/JPG/PNG, maks 2MB. Pastikan tulisan terbaca jelas."
                accept=".pdf,.jpg,.jpeg,.png"
                status={docStatus.kk.status}
                error={docStatus.kk.error}
                file={documents.kk}
                onSelect={(file) => uploadDocument("kk", file)}
                onRemove={() => removeDocument("kk")}
              />
              <DocumentField
                id="doc-akta"
                label="Akta Kelahiran"
                hint="PDF/JPG/PNG, maks 2MB. Sertakan halaman berisi nama dan tanggal lahir."
                accept=".pdf,.jpg,.jpeg,.png"
                status={docStatus.akta.status}
                error={docStatus.akta.error}
                file={documents.akta}
                onSelect={(file) => uploadDocument("akta", file)}
                onRemove={() => removeDocument("akta")}
              />
              <DocumentField
                id="doc-ijazah"
                label="Ijazah / SKL"
                hint="PDF/JPG/PNG, maks 2MB. Untuk SMK gunakan ijazah SMP/MTs atau SKL."
                accept=".pdf,.jpg,.jpeg,.png"
                status={docStatus.ijazah.status}
                error={docStatus.ijazah.error}
                file={documents.ijazah}
                onSelect={(file) => uploadDocument("ijazah", file)}
                onRemove={() => removeDocument("ijazah")}
              />
            </div>

            <p className="text-xs text-gray-500">
              Dokumen hanya dapat diakses panitia PPDB.
            </p>

            {Object.values(docStatus).some((state) => state.status === "uploading") ? (
              <p className="text-xs text-gray-500">Menunggu unggahan selesai sebelum melanjutkan.</p>
            ) : null}

            <div className="flex justify-between pt-6 border-t border-gray-100">
              <button
                onClick={prevStep}
                disabled={Object.values(docStatus).some((state) => state.status === "uploading")}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                &larr; Kembali
              </button>
              <button
                onClick={nextStep}
                disabled={Object.values(docStatus).some((state) => state.status === "uploading")}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                Selanjutnya &rarr;
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Konfirmasi Data</h2>
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
              <div className="grid grid-cols-3">
                <span className="text-gray-500">Pilihan Unit</span>
                <span className="col-span-2 font-medium text-gray-900">{formData.unit} - Kelas {formData.grade} {formData.major && `- ${formData.major}`}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-gray-500">Nama Siswa</span>
                <span className="col-span-2 font-medium text-gray-900">{formData.student_name}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-gray-500">Nama Ayah</span>
                <span className="col-span-2 font-medium text-gray-900">{formData.father_name}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-gray-500">No WhatsApp</span>
                <span className="col-span-2 font-medium text-gray-900">{formData.phone}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-gray-500">Dokumen diunggah</span>
                <span className="col-span-2 font-medium text-gray-900">{Object.keys(documents).length} dari 4</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-primary-50 rounded-lg border border-primary-100">
              <input type="checkbox" required id="agree" className="mt-1 w-5 h-5 text-primary-600 rounded" />
              <label htmlFor="agree" className="text-sm text-gray-700">
                Saya menyatakan bahwa data yang saya isikan adalah benar. Saya memahami jika ada ketidaksesuaian data dapat membatalkan proses pendaftaran.
              </label>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verifikasi Keamanan: Berapa hasil dari {captchaA} + {captchaB}? <span className="text-red-500">*</span>
              </label>
              <input 
                type="number" 
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                placeholder="Jawaban Anda"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 max-w-xs"
              />
            </div>

            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-3">
                <span className="text-red-500 text-lg leading-none mt-0.5">✕</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex justify-between pt-6 border-t border-gray-100">
              <button onClick={prevStep} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">&larr; Kembali</button>
              <button onClick={handleSubmit} disabled={loading || parseInt(captchaAnswer) !== (captchaA + captchaB)} className="px-8 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50">
                {loading ? "Menyimpan Data..." : "Kirim Pendaftaran"}
              </button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="text-center py-12 space-y-6">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">✓</div>
            <h2 className="text-3xl font-bold text-gray-900">{successMsg}</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Terima kasih telah mendaftar di Yayasan Nuurul Muttaqiin. Berikut adalah nomor pendaftaran Anda:
            </p>
            <div className="py-4 px-8 bg-gray-100 inline-block rounded-xl font-mono text-2xl font-bold text-primary-800 tracking-wider">
              {regNumber}
            </div>
            <p className="text-sm text-gray-500">Silakan simpan nomor ini untuk mengecek status pendaftaran Anda.</p>
            
            <div className="pt-8 flex flex-col sm:flex-row justify-center gap-4">
              <button onClick={() => window.location.href = '/'} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">Kembali ke Beranda</button>
              <button onClick={() => window.location.href = `/ppdb/status?reg=${regNumber}`} className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700">Cek Status Pendaftaran</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
