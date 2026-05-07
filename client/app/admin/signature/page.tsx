"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { staffSignaturesApi } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, PenLine, Upload } from "lucide-react";

export default function StaffSignaturePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    signerName: "",
    title: "",
  });

  useEffect(() => {
    if (!user) return;
    if (user.role === "admin") {
      router.replace("/admin");
      return;
    }
    if (user.role !== "hod") return;
    setForm({
      signerName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      title: user.originalRole === "secutuary" ? "Secutuary" : "Head of Department",
    });
    void loadSignature();
  }, [user, router]);

  const loadSignature = async () => {
    setLoading(true);
    const result = await staffSignaturesApi.getMine();
    if (result.error) {
      toast.error(result.error);
    } else if ((result.data as any).signature) {
      const signature = (result.data as any).signature;
      setForm({
        signerName: signature.signerName || "",
        title: signature.title || "",
      });
      setSignatureDataUrl(signature.signatureDataUrl || null);
    }
    setLoading(false);
  };

  const onFile = (file?: File) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Upload a PNG, JPG, or WEBP signature image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSignatureDataUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    const result = await staffSignaturesApi.saveMine({
      signerName: form.signerName,
      title: form.title,
      signatureDataUrl,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Digital signature saved");
      void loadSignature();
    }
    setSaving(false);
  };

  if (!user || user.role !== "hod") return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
          <PenLine className="h-7 w-7 text-primary" />
          Digital Signature Setup
        </h1>
        <p className="text-muted-foreground">
          This signature will appear on newly approved general letters and official placement letters for your department.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Signer Details</CardTitle>
          <CardDescription>
            When an HOD/Secretary changes, the new staff member updates this once. Existing letters keep their previous signature snapshot.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Printed Name</Label>
                  <Input value={form.signerName} onChange={(e) => setForm({ ...form, signerName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Signature Image</Label>
                <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => onFile(e.target.files?.[0])} />
                <p className="text-sm text-muted-foreground">
                  Transparent PNG is best. If no image is uploaded, the system uses a generated placeholder signature.
                </p>
              </div>

              <div className="rounded-xl border bg-muted/40 p-5">
                <p className="mb-3 text-sm font-medium">Preview</p>
                {signatureDataUrl ? (
                  <img src={signatureDataUrl} alt="Signature preview" className="h-20 max-w-xs object-contain" />
                ) : (
                  <div className="font-serif text-3xl italic text-slate-800">{form.signerName || "Dr. Kwame Mensah"}</div>
                )}
                <div className="mt-3 font-semibold">{form.signerName || "Dr. Kwame Mensah"}</div>
                <div className="text-sm text-muted-foreground">[{(form.title || "Head of Department").toUpperCase()} - {(user.department || "Department").toUpperCase()}]</div>
              </div>

              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Save Digital Signature
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
