import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/DatePicker";
import { api } from "@/lib/api";

type ForgotPasswordModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Lupa Password.
 *
 * PRD 5.6 (keamanan): token reset TIDAK dikembalikan oleh API. Backend
 * mengirim LINK reset ke email pengguna. Form ini hanya verifikasi
 * email + tanggal lahir, lalu memberi tahu user untuk mengecek inbox.
 * Reset password dilakukan di halaman /reset-password?token=... dari link email.
 */
export function ForgotPasswordModal({ isOpen, onOpenChange }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false);

  const resetFormState = useCallback(() => {
    setEmail("");
    setDob("");
    setIsLoading(false);
    setError(null);
    setIsEmailSent(false);
    setIsNotFound(false);
  }, []);

  // Reset state setiap kali modal dibuka, sehingga mengklik trigger "Lupa Password"
  // dari halaman Login selalu memunculkan form kosong (tidak nyangkut di state lama).
  useEffect(() => {
    if (isOpen) resetFormState();
  }, [isOpen, resetFormState]);

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!dob) {
      setError("Tanggal lahir wajib diisi.");
      setIsLoading(false);
      return;
    }

    try {
      await api.post("/api/auth/forgot-password", { email, dob });
      // Sukses: instruksi reset terkirim ke email (token TIDAK tampil di sini).
      setIsEmailSent(true);
    } catch (err: any) {
      if (err.message === "Email tidak ditemukan" || err.message === "Tanggal lahir tidak sesuai") {
        setIsNotFound(true);
      } else {
        setError(err.message || "Terjadi kesalahan.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetFormState();
    }}>
      <DialogContent className="sm:max-w-[425px]">
        {isEmailSent ? (
          <div className="text-center py-10">
            <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <DialogTitle className="mt-4">Cek Email Anda</DialogTitle>
            <DialogDescription className="mt-2">
              Jika email Anda terdaftar di sistem kami, instruksi pemulihan kata sandi
              telah dikirimkan. Silakan cek kotak masuk atau folder spam Anda.
            </DialogDescription>
            <Button onClick={() => onOpenChange(false)} className="mt-6">Kembali ke Login</Button>
          </div>
        ) : isNotFound ? (
          <div className="text-center py-10">
            <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <DialogTitle className="mt-4">Maaf, Data Tidak Sesuai</DialogTitle>
            <DialogDescription className="mt-2">
              Email atau tanggal lahir tidak cocok dengan data kami. Mohon periksa kembali.
            </DialogDescription>
            <Button variant="outline" onClick={() => setIsNotFound(false)} className="mt-6">Coba Lagi</Button>
          </div>
        ) : (
          <form onSubmit={handleVerify}>
            <DialogHeader>
              <DialogTitle>Lupa Password?</DialogTitle>
              <DialogDescription>
                Masukkan email dan tanggal lahir yang terdaftar untuk verifikasi.
                Link reset password akan dikirim ke email Anda.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@anda.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Tanggal Lahir</Label>
                <DatePicker
                  id="dob"
                  value={dob}
                  onValueChange={setDob}
                  placeholder="Pilih tanggal lahir"
                  maxDate={new Date()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Memverifikasi..." : "Kirim Link Reset"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
