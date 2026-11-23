package it.gabrydl.quadernopatentino;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.provider.Settings;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.core.content.FileProvider;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.webkit.WebViewAssetLoader;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Quaderno Patentino: la stessa web app del sito, impacchettata nell'APK.
 * Le pagine stanno negli asset (assets/www) e si aprono da https://appassets.androidplatform.net,
 * così account (Supabase), traduttore e audio funzionano come sul sito.
 * All'apertura controlla su GitHub se c'è una versione più nuova e propone l'aggiornamento.
 */
public class MainActivity extends Activity {

    static final String HOST = "appassets.androidplatform.net";
    static final String HOME = "https://" + HOST + "/assets/www/index.html";
    static final String RELEASES = "https://api.github.com/repos/Gabrydl/Quaderno-Patentino/releases/latest";
    static final int REQ_FILE = 1, REQ_INSTALL_PERM = 2;

    WebView web;
    FrameLayout root;
    WebViewAssetLoader loader;
    ValueCallback<Uri[]> fileCb;
    Uri cameraUri;
    File apkPending;
    String updUrl;          // aggiornamento proposto (riquadro nella pagina)
    boolean updWeb;         // true se il riquadro è quello della pagina (avanzamento mostrato lì)
    final Handler ui = new Handler(Looper.getMainLooper());

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        if (Build.VERSION.SDK_INT < 35) {
            getWindow().setStatusBarColor(Color.TRANSPARENT);
            getWindow().setNavigationBarColor(Color.TRANSPARENT);
        }

        root = new FrameLayout(this);
        web = new WebView(this);
        root.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);
        // barre di sistema e tastiera: la pagina resta sempre nella parte visibile
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, ins) -> {
            Insets b = ins.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.ime() | WindowInsetsCompat.Type.displayCutout());
            v.setPadding(b.left, b.top, b.right, b.bottom);
            return WindowInsetsCompat.CONSUMED;
        });

        loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportMultipleWindows(false);
        s.setUserAgentString(s.getUserAgentString() + " QuadernoApp/" + BuildConfig.VERSION_NAME);
        CookieManager.getInstance().setAcceptCookie(true);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        web.addJavascriptInterface(new Ponte(), "QPApp");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (!HOST.equals(u.getHost())) return null;
                String p = u.getPath();
                if (p != null && p.endsWith("/")) u = u.buildUpon().path(p + "index.html").build();
                return loader.shouldInterceptRequest(u);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (HOST.equals(u.getHost())) return false;
                apriFuori(u);
                return true;
            }

            @Override
            public void onPageFinished(WebView v, String url) {
                // colore delle barre di sistema uguale allo sfondo della pagina (tema chiaro/scuro)
                v.evaluateJavascript("(function(){if(window.__qpTinta)return;window.__qpTinta=1;"
                        + "function s(){try{var e=document.body||document.documentElement;QPApp.tinta(getComputedStyle(e).backgroundColor)}catch(x){}}"
                        + "s();var o=new MutationObserver(function(){setTimeout(s,60)});o.observe(document.documentElement,{attributes:true});"
                        + "if(document.body)o.observe(document.body,{attributes:true});"
                        + "matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(){setTimeout(s,60)})})()", null);
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (fileCb != null) fileCb.onReceiveValue(null);
                fileCb = cb;
                apriScelta(p);
                return true;
            }
        });

        web.setDownloadListener((url, ua, cd, mime, len) -> apriFuori(Uri.parse(url)));

        if (state != null) web.restoreState(state);
        else web.loadUrl(HOME);

        controllaAggiornamento();
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onResume() {
        super.onResume();
        // tornato dalle impostazioni "installa app sconosciute": riprova l'installazione
        if (apkPending != null && puoInstallare()) { File f = apkPending; apkPending = null; installa(f); }
    }

    void apriFuori(Uri u) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, u));
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "Nessuna app per aprire il link", Toast.LENGTH_SHORT).show();
        }
    }

    // ---------- foto e allegati (foto profilo, segnalazioni, foto nel traduttore) ----------
    void apriScelta(WebChromeClient.FileChooserParams p) {
        Intent scegli;
        try { scegli = p.createIntent(); } catch (Exception e) { scegli = new Intent(Intent.ACTION_GET_CONTENT).setType("*/*"); }
        scegli.addCategory(Intent.CATEGORY_OPENABLE);
        if (p.getMode() == WebChromeClient.FileChooserParams.MODE_OPEN_MULTIPLE) scegli.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);

        List<Intent> extra = new ArrayList<>();
        boolean immagini = false;
        for (String t : p.getAcceptTypes()) if (t == null || t.isEmpty() || t.startsWith("image") || t.equals("*/*")) immagini = true;
        cameraUri = null;
        if (immagini) {
            try {
                File dir = new File(getCacheDir(), "foto"); dir.mkdirs();
                File f = new File(dir, "foto-" + System.currentTimeMillis() + ".jpg");
                cameraUri = FileProvider.getUriForFile(this, getPackageName() + ".file", f);
                Intent cam = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                cam.putExtra(MediaStore.EXTRA_OUTPUT, cameraUri);
                cam.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                cam.setClipData(ClipData.newRawUri("", cameraUri));
                if (cam.resolveActivity(getPackageManager()) != null) extra.add(cam);
                else cameraUri = null;
            } catch (Exception e) { cameraUri = null; }
        }
        Intent ch = Intent.createChooser(scegli, "Scegli");
        if (!extra.isEmpty()) ch.putExtra(Intent.EXTRA_INITIAL_INTENTS, extra.toArray(new Intent[0]));
        try {
            startActivityForResult(ch, REQ_FILE);
        } catch (ActivityNotFoundException e) {
            fileCb.onReceiveValue(null); fileCb = null;
        }
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        if (req == REQ_INSTALL_PERM) {
            if (apkPending != null && puoInstallare()) { File f = apkPending; apkPending = null; installa(f); }
            return;
        }
        if (req != REQ_FILE || fileCb == null) { super.onActivityResult(req, res, data); return; }
        Uri[] out = null;
        if (res == RESULT_OK) {
            if (data != null && data.getClipData() != null && data.getClipData().getItemCount() > 0
                    && (cameraUri == null || !cameraUri.equals(data.getClipData().getItemAt(0).getUri()))) {
                ClipData c = data.getClipData();
                out = new Uri[c.getItemCount()];
                for (int i = 0; i < c.getItemCount(); i++) out[i] = c.getItemAt(i).getUri();
            } else if (data != null && data.getData() != null) {
                out = new Uri[]{data.getData()};
            } else if (cameraUri != null) {
                out = new Uri[]{cameraUri};
            }
        }
        fileCb.onReceiveValue(out);
        fileCb = null;
    }

    // ---------- colore barre ----------
    class Ponte {
        @JavascriptInterface
        public void aggiorna() { String u = updUrl; if (u != null) ui.post(() -> scarica(u)); }

        @JavascriptInterface
        public void piuTardi() { updUrl = null; }

        @JavascriptInterface
        public void tinta(String css) {
            Matcher m = Pattern.compile("(\\d+)\\D+(\\d+)\\D+(\\d+)").matcher(css == null ? "" : css);
            if (!m.find()) return;
            int r = Integer.parseInt(m.group(1)), g = Integer.parseInt(m.group(2)), b = Integer.parseInt(m.group(3));
            int col = Color.rgb(r, g, b);
            boolean chiaro = (0.299 * r + 0.587 * g + 0.114 * b) > 150;
            ui.post(() -> {
                root.setBackgroundColor(col);
                getWindow().getDecorView().setBackgroundColor(col);
                WindowCompat.getInsetsController(getWindow(), root).setAppearanceLightStatusBars(chiaro);
                WindowCompat.getInsetsController(getWindow(), root).setAppearanceLightNavigationBars(chiaro);
            });
        }
    }

    // ---------- aggiornamento automatico da GitHub ----------
    void controllaAggiornamento() {
        new Thread(() -> {
            try {
                HttpURLConnection c = (HttpURLConnection) new URL(RELEASES).openConnection();
                c.setConnectTimeout(8000); c.setReadTimeout(8000);
                c.setRequestProperty("Accept", "application/vnd.github+json");
                c.setRequestProperty("User-Agent", "QuadernoApp");
                if (c.getResponseCode() != 200) return;
                JSONObject j = new JSONObject(leggi(c.getInputStream()));
                String tag = j.optString("tag_name", "");
                if (!tag.startsWith("apk-")) return;
                int code = Integer.parseInt(tag.substring(4));
                if (code <= BuildConfig.VERSION_CODE) return;
                JSONArray as = j.getJSONArray("assets");
                String url = null;
                for (int i = 0; i < as.length(); i++) {
                    JSONObject a = as.getJSONObject(i);
                    if (a.optString("name").endsWith(".apk")) { url = a.getString("browser_download_url"); break; }
                }
                if (url == null) return;
                String nome = j.optString("name", "nuova versione");
                String dl = url, body = j.optString("body", "");
                ui.post(() -> chiediAggiornamento(nome, dl, body, 0));
            } catch (Exception ignored) { }
        }).start();
    }

    // riquadro nella pagina, con lo stile dell'app (strumenti/app/aggiorna.js); se la pagina non è pronta riprova, poi usa quello di Android
    void chiediAggiornamento(String nome, String url, String body, int tentativo) {
        if (isFinishing()) return;
        updUrl = url;
        try {
            JSONObject d = new JSONObject();
            d.put("nome", nome);
            d.put("versione", nome.replaceAll("^.*?([0-9]+\\.[0-9]+\\.[0-9]+).*$", "$1"));
            d.put("novita", body);
            web.evaluateJavascript("window.QP_UPD ? QP_UPD(" + d + ") : false", v -> {
                if ("true".equals(v)) { updWeb = true; return; }
                if (tentativo < 6) ui.postDelayed(() -> chiediAggiornamento(nome, url, body, tentativo + 1), 1500);
                else { updWeb = false; dialogoAggiornamento(nome, url); }
            });
        } catch (Exception e) { updWeb = false; dialogoAggiornamento(nome, url); }
    }

    void progresso(int pc, String fase) {
        if (updWeb) web.evaluateJavascript("window.QP_UPD_PROG && QP_UPD_PROG(" + pc + "," + (fase == null ? "null" : "'" + fase + "'") + ")", null);
    }

    void dialogoAggiornamento(String nome, String url) {
        if (isFinishing()) return;
        new AlertDialog.Builder(this)
                .setTitle("Aggiornamento disponibile")
                .setMessage(nome + "\n\nÈ disponibile una nuova versione dell'app. Aggiornare ora?")
                .setPositiveButton("Aggiorna", (d, w) -> scarica(url))
                .setNegativeButton("Più tardi", null)
                .show();
    }

    void scarica(String url) {
        if (updWeb) { scaricaFile(url, null, null); return; }
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        int pad = (int) (20 * getResources().getDisplayMetrics().density);
        box.setPadding(pad, pad, pad, pad / 2);
        TextView tx = new TextView(this); tx.setText("Scarico l'aggiornamento…");
        ProgressBar pb = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        pb.setMax(100);
        box.addView(tx); box.addView(pb);
        AlertDialog dlg = new AlertDialog.Builder(this).setView(box).setCancelable(false).show();
        scaricaFile(url, dlg, pb);
    }

    void scaricaFile(String url, AlertDialog dlg, ProgressBar pb) {
        new Thread(() -> {
            try {
                HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                c.setInstanceFollowRedirects(true);
                c.setRequestProperty("User-Agent", "QuadernoApp");
                int tot = c.getContentLength();
                File dir = new File(getCacheDir(), "agg"); dir.mkdirs();
                File f = new File(dir, "QuadernoPatentino.apk");
                try (InputStream in = c.getInputStream(); OutputStream out = new FileOutputStream(f)) {
                    byte[] buf = new byte[64 * 1024]; long letti = 0; int n, ultimo = -1;
                    while ((n = in.read(buf)) > 0) {
                        out.write(buf, 0, n); letti += n;
                        if (tot > 0) { int pc = (int) (letti * 100 / tot); if (pc != ultimo) { ultimo = pc; ui.post(() -> { if (pb != null) pb.setProgress(pc); progresso(pc, null); }); } }
                    }
                }
                ui.post(() -> { if (dlg != null) dlg.dismiss(); progresso(100, "installa"); installa(f); });
            } catch (Exception e) {
                ui.post(() -> { if (dlg != null) dlg.dismiss(); progresso(0, "errore"); if (!updWeb) Toast.makeText(this, "Download non riuscito: riprova più tardi", Toast.LENGTH_LONG).show(); });
            }
        }).start();
    }

    boolean puoInstallare() {
        return Build.VERSION.SDK_INT < 26 || getPackageManager().canRequestPackageInstalls();
    }

    void installa(File f) {
        if (!puoInstallare()) {
            apkPending = f;
            new AlertDialog.Builder(this)
                    .setTitle("Permesso necessario")
                    .setMessage("Per aggiornarsi, l'app deve poter installare aggiornamenti. Nella schermata che si apre attiva «Consenti da questa fonte», poi torna indietro.")
                    .setPositiveButton("Apri impostazioni", (d, w) -> {
                        try {
                            startActivityForResult(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getPackageName())), REQ_INSTALL_PERM);
                        } catch (Exception e) { apkPending = null; }
                    })
                    .setNegativeButton("Annulla", (d, w) -> apkPending = null)
                    .show();
            return;
        }
        Uri u = FileProvider.getUriForFile(this, getPackageName() + ".file", f);
        Intent i = new Intent(Intent.ACTION_VIEW);
        i.setDataAndType(u, "application/vnd.android.package-archive");
        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        try { startActivity(i); } catch (Exception e) { Toast.makeText(this, "Impossibile avviare l'installazione", Toast.LENGTH_LONG).show(); }
    }

    static String leggi(InputStream in) throws Exception {
        ByteArrayOutputStream b = new ByteArrayOutputStream();
        byte[] buf = new byte[8192]; int n;
        while ((n = in.read(buf)) > 0) b.write(buf, 0, n);
        in.close();
        return b.toString("UTF-8");
    }
}
