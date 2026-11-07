"use client";

import { useState, useEffect, useRef } from "react";
import { UnitInformation } from "./UnitInformation";
import { UnitPreview } from "./UnitPreview";
import type { PPDBUnit } from "./types";



interface PpdbError {
  message: string;
}

const DEFAULT_UNITS: PPDBUnit[] = [
  { id: 0, name: "LPQ Nuurul Muttaqiin", slug: "lpq", image_url: null, logo_url: null, description: "Lembaga Pendidikan Al-Quran untuk usia dini dan anak-anak." },
  { id: 0, name: "TK Nuurul Muttaqiin", slug: "tk", image_url: null, logo_url: null, description: "Taman Kanak-Kanak Islam Terpadu dengan pendekatan bermain sambil belajar." },
  { id: 0, name: "SD Nuurul Muttaqiin", slug: "sd", image_url: null, logo_url: null, description: "Sekolah Dasar Islam Terpadu yang mengedepankan adab dan ilmu." },
  { id: 0, name: "SMP Nuurul Muttaqiin", slug: "smp", image_url: null, logo_url: null, description: "Sekolah Menengah Pertama dengan program tahfidz unggulan." },
  { id: 0, name: "SMK Nuurul Muttaqiin", slug: "smk", image_url: null, logo_url: null, description: "Sekolah Menengah Kejuruan berwawasan global berlandaskan Islam." },
];

export function PPDBForm({ units }: { units: PPDBUnit[] }) {
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
  const availableUnits = units.length > 0 ? units : DEFAULT_UNITS;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- captcha acak tiap mount
    setCaptchaA(Math.floor(Math.random() * 10) + 1);
     
    setCaptchaB(Math.floor(Math.random() * 10) + 1);
  }, []);

  const [formData, setFormData] = useState({
    unit: "",
    grade: "",
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

  const selectUnit = (value: string) => {
    let defaultGrade = "";
    if (value === "SMK") defaultGrade = "10";
    else if (value === "SMP") defaultGrade = "7";
    else if (value === "SD") defaultGrade = "1";
    else if (value === "TK") defaultGrade = "TK A";
    else if (value === "LPQ") defaultGrade = "Dasar";

    setFormData((prev) => ({ ...prev, unit: value, major: "", grade: defaultGrade }));
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "unit") {
      selectUnit(value);
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

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
          siblings_count: 0
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

  const isStep2Valid = () => {
    if (formData.student_name.length < 3 || formData.birth_place.length < 3 || !formData.birth_date || formData.address.length < 10) return false;
    if (formData.unit === 'SMK') {
      if (!formData.nisn || !formData.nik || !formData.religion || !formData.previous_school) return false;
    }
    return true;
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
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
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Pilih Unit & Jenjang</h2>
            
            <fieldset>
              <legend className="mb-2 block text-sm font-medium text-gray-700">
                Unit Sekolah Tujuan <span className="text-red-500">*</span>
              </legend>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {availableUnits.map((unit) => {
                  const code = unit.slug.toUpperCase();
                  const selected = formData.unit === code;
                  const image = unit.image_url && !unit.image_url.startsWith("/uploads/dummy/") ? unit.image_url : null;
                  return (
                    <label
                      key={unit.slug}
                      className={`group relative cursor-pointer overflow-hidden rounded-xl border bg-white transition-colors focus-within:ring-2 focus-within:ring-primary-100 ${
                        selected ? "border-primary-500 ring-2 ring-primary-100" : "border-gray-200 hover:border-primary-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="unit"
                        value={code}
                        checked={selected}
                        onChange={() => selectUnit(code)}
                        className="sr-only"
                      />
                      {image ? (
                        <img
                          src={image}
                          alt={`Foto ${unit.name}`}
                          className="h-20 w-full object-cover sm:h-24"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="flex h-20 w-full items-center justify-center bg-primary-50 sm:h-24">
                          <span className="text-2xl font-bold text-primary-700" aria-hidden="true">
                            {unit.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="p-2.5">
                        <p className="line-clamp-2 text-sm font-semibold text-gray-900">{unit.name}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </fieldset>

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
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap <span className="text-red-500">*</span></label>
                <input type="text" required name="student_name" value={formData.student_name} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" />
              </div>
              
              {formData.unit === 'SMK' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">NISN <span className="text-red-500">*</span></label>
                    <input type="text" required name="nisn" value={formData.nisn} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">No. Induk Kependudukan (NIK) <span className="text-red-500">*</span></label>
                    <input type="text" required name="nik" value={formData.nik} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">NISN (Opsional)</label>
                  <input type="text" name="nisn" value={formData.nisn} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tempat Lahir <span className="text-red-500">*</span></label>
                <input type="text" required name="birth_place" value={formData.birth_place} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Lahir <span className="text-red-500">*</span></label>
                <input type="date" required name="birth_date" value={formData.birth_date} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Kelamin <span className="text-red-500">*</span></label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg bg-white">
                  <option value="Laki-laki">Laki-Laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              {formData.unit === 'SMK' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Agama <span className="text-red-500">*</span></label>
                  <select required name="religion" value={formData.religion} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg bg-white">
                    <option value="">-- Pilih Agama --</option>
                    <option value="Islam">Islam</option>
                    <option value="Kristen">Kristen</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Konghucu">Konghucu</option>
                  </select>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Alamat Tempat Tinggal <span className="text-red-500">*</span></label>
                <textarea required name="address" value={formData.address} onChange={handleChange} rows={3} className="w-full p-3 border border-gray-300 rounded-lg"></textarea>
              </div>

              {formData.unit === 'SMK' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Asal Sekolah (SMP/MTs) <span className="text-red-500">*</span></label>
                    <input type="text" required name="previous_school" value={formData.previous_school} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Apakah Penerima KPS/PKH/KIP/PIP <span className="text-red-500">*</span></label>
                    <select required name="is_pip" value={formData.is_pip} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg bg-white">
                      <option value="TIDAK">TIDAK</option>
                      <option value="YA">YA</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex justify-between pt-6 border-t border-gray-100">
              <button onClick={prevStep} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">&larr; Kembali</button>
              <button onClick={nextStep} disabled={!isStep2Valid()} className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50">Selanjutnya &rarr;</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Orang Tua / Wali</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Ayah <span className="text-red-500">*</span></label>
                <input type="text" required name="father_name" value={formData.father_name} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Ibu <span className="text-red-500">*</span></label>
                <input type="text" required name="mother_name" value={formData.mother_name} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">No. HP / WhatsApp Aktif <span className="text-red-500">*</span></label>
                <input type="text" required name="phone" value={formData.phone} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
                <input type="email" required name="email" value={formData.email} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" />
              </div>
            </div>
            
            <div className="flex justify-between pt-6 border-t border-gray-100">
              <button onClick={prevStep} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">&larr; Kembali</button>
              <button onClick={nextStep} disabled={formData.father_name.length < 3 || formData.mother_name.length < 3 || !/^(08|62)\d{8,13}$/.test(formData.phone) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)} className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50">Selanjutnya &rarr;</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Dokumen (Opsional)</h2>
            <div className="bg-blue-50 p-4 rounded-lg text-blue-800 text-sm mb-6 border border-blue-200">
              <p>Anda dapat mengunggah dokumen pendukung sekarang atau nanti saat daftar ulang. Kosongkan jika belum ada.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kartu Keluarga (KK)</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="w-full p-3 border border-gray-300 rounded-lg bg-white" />
                <span className="text-xs text-gray-500 mt-1 block">Format: PDF, JPG, PNG (Maks 2MB)</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Akta Kelahiran</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="w-full p-3 border border-gray-300 rounded-lg bg-white" />
                <span className="text-xs text-gray-500 mt-1 block">Format: PDF, JPG, PNG (Maks 2MB)</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ijazah / SKL</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="w-full p-3 border border-gray-300 rounded-lg bg-white" />
                <span className="text-xs text-gray-500 mt-1 block">Format: PDF, JPG, PNG (Maks 2MB)</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pas Foto (3x4)</label>
                <input type="file" accept=".jpg,.jpeg,.png" className="w-full p-3 border border-gray-300 rounded-lg bg-white" />
                <span className="text-xs text-gray-500 mt-1 block">Format: JPG, PNG (Maks 1MB)</span>
              </div>
            </div>
            
            <div className="flex justify-between pt-6 border-t border-gray-100">
              <button onClick={prevStep} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">&larr; Kembali</button>
              <button onClick={nextStep} className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700">Selanjutnya &rarr;</button>
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
