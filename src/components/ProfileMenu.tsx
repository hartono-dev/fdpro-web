import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { User, Key, Share2, LogOut, Check, Camera, AlertCircle, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/Badge";
import EditAdminProfileDialog from "./EditAdminProfileDialog";

const initials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

export function ProfileMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleClose = () => setIsOpen(false);

  const copyReferral = async () => {
    if (!user?.fdCode) return;
    const link = `${window.location.origin}/?ref=${user.fdCode}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setShowReferralModal(false);
    }, 2000);
  };

  const handleLogout = () => {
    logout();
    navigate("/member");
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('openProfileMenu') === 'true') {
      setIsOpen(true);
      const newUrl = `${location.pathname}${location.hash || ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [location.search, location.pathname, location.hash]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const isAdmin = user.role === 'admin' || user.role === 'super_admin';

  return (
    <>
      <div className="relative">
        <div
          ref={triggerRef}
          role="button"
          tabIndex={0}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={(e) => e.key === 'Enter' && setIsOpen(!isOpen)}
          className="h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors flex items-center justify-center cursor-pointer select-none border border-primary/20"
        >
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <span className="text-primary font-bold text-sm">{initials(user.name)}</span>
          )}
        </div>

        {isOpen && (
          isAdmin ? (
            <div
              ref={dropdownRef}
              className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-lg border p-4 z-50"
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xl overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="h-16 w-16 rounded-full object-cover" />
                  ) : (
                    initials(user.name)
                  )}
                </div>
                <div className="w-full">
                  <p className="font-bold text-gray-900 truncate" title={user.name}>{user.name}</p>
                  <p className="text-sm text-gray-500 truncate" title={user.email}>{user.email}</p>
                  {user.phone && <p className="text-sm text-gray-500 truncate" title={user.phone}>{user.phone}</p>}
                </div>
                <Badge variant={user.role === 'super_admin' ? 'default' : 'secondary'}>
                  {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </Badge>
              </div>

              <div className="border-t my-3"></div>

              <div className="space-y-1">
                <Button variant="outline" className="w-full justify-start" onClick={() => { setShowEditProfileModal(true); handleClose(); }}>
                  <Pencil className="h-4 w-4 mr-2" /> Edit Profil
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => { navigate('/change-password'); handleClose(); }}>
                  <Key className="h-4 w-4 mr-2" /> Ubah Password
                </Button>
                <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" /> Log Out
                </Button>
              </div>
            </div>
          ) : (
            <div
              ref={dropdownRef}
              className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border p-2 z-50"
            >
              <div className="flex items-center gap-3 p-2 border-b mb-2">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                  {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="h-10 w-10 rounded-full object-cover"/> : initials(user.name)}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-800 truncate" title={user.name}>{user.name}</p>
                  <p className="text-xs text-gray-500 truncate" title={user.email}>{user.email}</p>
                </div>
              </div>
              
              <Link to="/member/profile" onClick={handleClose} className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-gray-100 flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span>Profil Saya</span>
              </Link>
              
              <Link to="/member/change-password" onClick={handleClose} className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-gray-100 flex items-center gap-2">
                <Key className="h-4 w-4 text-gray-500" />
                <span>Ubah Password</span>
              </Link>

              <button
                onClick={() => { setShowReferralModal(true); handleClose(); }}
                className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-gray-100 flex items-center gap-2"
              >
                <Share2 className="h-4 w-4 text-gray-500" />
                <span>Bagikan Link Referral</span>
              </button>

              <div className="border-t my-1"></div>

              <button onClick={handleLogout} className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-gray-100 flex items-center gap-2 text-red-600">
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </button>
            </div>
          )
        )}
      </div>

      <UploadAvatarModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} />
      <ReferralModal isOpen={showReferralModal} onClose={() => setShowReferralModal(false)} referralCode={user.fdCode || ""} copied={copied} onCopy={copyReferral} />
      <EditAdminProfileDialog open={showEditProfileModal} onOpenChange={setShowEditProfileModal} />
    </>
  );
}

function ReferralModal({ isOpen, onClose, referralCode, copied, onCopy }: {
  isOpen: boolean; onClose: () => void; referralCode: string; copied: boolean; onCopy: () => void;
}) {
  const referralLink = referralCode ? `${window.location.origin}/?ref=${referralCode}` : "";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bagikan Link Referral</DialogTitle>
          <DialogDescription>Salin link referral di bawah dan bagikan ke teman atau rekan Anda.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex gap-2">
            <Input readOnly value={referralLink} className="flex-1" onClick={(e) => (e.target as HTMLInputElement).select()} />
            <Button type="button" onClick={onCopy} variant={copied ? "default" : "outline"}>
              {copied ? (
                <span className="flex items-center gap-1"><Check className="h-4 w-4" />Tersalin!</span>
              ) : ( "Salin Link" )}
            </Button>
          </div>
          {copied && (
            <p className="mt-3 text-sm text-red-600 text-center font-medium">Link referral berhasil disalin!</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ProfileMenu;

function UploadAvatarModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(user?.avatarUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { setError("Ukuran file maksimal 2MB."); return; }
      if (!['image/jpeg', 'image/png'].includes(file.type)) { setError("Hanya format JPG atau PNG."); return; }
      setError(null);
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("avatar", selectedFile);

    try {
      const response = await api.upload("/api/user/upload-avatar", formData);
      updateUser({ avatarUrl: response.data.url });
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal mengunggah foto.");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setPreview(user?.avatarUrl || null);
      setError(null);
    }
  }, [isOpen, user?.avatarUrl]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Ganti Foto Profil</DialogTitle></DialogHeader>
        <div className="py-4 space-y-4 flex flex-col items-center">
          <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 cursor-pointer hover:border-primary transition-colors" onClick={() => fileInputRef.current?.click()}>
            {preview ? <img src={preview} alt="Preview" className="w-full h-full object-cover" /> : <Camera className="h-8 w-8 text-gray-400" />}
          </div>
          <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png" onChange={handleFileSelect} className="hidden" />
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>Pilih Foto</Button>
          {error && <div className="flex items-center gap-2 text-sm text-red-600"><AlertCircle className="h-4 w-4" /><span>{error}</span></div>}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="button" onClick={handleUpload} disabled={!selectedFile || uploading}>{uploading ? "Mengunggah..." : "Simpan"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
