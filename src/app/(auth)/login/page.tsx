"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push(redirect);
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}` },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{background:"#080C14"}}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,#F59E0B,#EF4444)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,margin:"0 auto 16px"}}>⚡</div>
          <h1 style={{fontWeight:800,fontSize:24,color:"#fff",marginBottom:4}}>Bon retour</h1>
          <p style={{color:"#64748b",fontSize:14}}>Connectez-vous à votre espace EnergyHub</p>
        </div>

        <div style={{background:"#0D1520",border:"1px solid #1E293B",borderRadius:12,padding:24}}>
          <button onClick={handleGoogle} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:12,padding:"10px 0",border:"1px solid #1E293B",borderRadius:8,background:"transparent",color:"#cbd5e1",cursor:"pointer",marginBottom:20,fontSize:14}}>
            <svg width="16" height="16" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
            Continuer avec Google
          </button>

          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
            <div style={{flex:1,height:1,background:"#1E293B"}}/>
            <span style={{fontSize:12,color:"#475569"}}>ou par email</span>
            <div style={{flex:1,height:1,background:"#1E293B"}}/>
          </div>

          {error && (
            <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",color:"#EF4444",fontSize:12,borderRadius:8,padding:"10px 14px",marginBottom:16}}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{marginBottom:16}}>
              <label style={{display:"block",fontSize:11,fontWeight:600,color:"#94a3b8",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                style={{width:"100%",background:"#080C14",border:"1px solid #1E293B",borderRadius:8,padding:"10px 14px",fontSize:14,color:"#e2e8f0",outline:"none",boxSizing:"border-box"}}
                placeholder="vous@entreprise.be" required />
            </div>
            <div style={{marginBottom:20}}>
              <label style={{display:"block",fontSize:11,fontWeight:600,color:"#94a3b8",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                style={{width:"100%",background:"#080C14",border:"1px solid #1E293B",borderRadius:8,padding:"10px 14px",fontSize:14,color:"#e2e8f0",outline:"none",boxSizing:"border-box"}}
                placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading}
              style={{width:"100%",background:"#F59E0B",color:"#000",fontWeight:700,padding:"12px 0",borderRadius:8,border:"none",cursor:"pointer",fontSize:14}}>
              {loading ? "Connexion..." : "Se connecter →"}
            </button>
          </form>

          <p style={{textAlign:"center",fontSize:12,color:"#475569",marginTop:16}}>
            <Link href="/forgot-password" style={{color:"#94a3b8",textDecoration:"none"}}>Mot de passe oublié ?</Link>
          </p>
        </div>

        <p style={{textAlign:"center",fontSize:14,color:"#64748b",marginTop:24}}>
          Pas encore inscrit ?{" "}
          <Link href="/register" style={{color:"#F59E0B",fontWeight:600}}>Créer un compte gratuit</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{minHeight:"100vh",background:"#080C14"}} />}>
      <LoginForm />
    </Suspense>
  );
}
