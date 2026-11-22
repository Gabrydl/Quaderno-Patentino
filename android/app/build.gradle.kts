plugins {
    id("com.android.application")
}

// Numero e nome di versione arrivano dal workflow di GitHub (numero della build e versione della web app).
val vCode = (System.getenv("VCODE") ?: "1").toInt()
val vName = System.getenv("VNAME") ?: "dev"
val ksFile = System.getenv("KS_FILE")

android {
    namespace = "it.gabrydl.quadernopatentino"
    compileSdk = 35

    defaultConfig {
        applicationId = "it.gabrydl.quadernopatentino"
        minSdk = 24
        targetSdk = 35
        versionCode = vCode
        versionName = vName
    }

    signingConfigs {
        if (ksFile != null) {
            create("rilascio") {
                storeFile = file(ksFile)
                storePassword = System.getenv("KS_PASS")
                keyAlias = "quaderno"
                keyPassword = System.getenv("KS_PASS")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            if (ksFile != null) signingConfig = signingConfigs.getByName("rilascio")
        }
    }

    buildFeatures { buildConfig = true }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

}

dependencies {
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("androidx.core:core:1.13.1")
}
