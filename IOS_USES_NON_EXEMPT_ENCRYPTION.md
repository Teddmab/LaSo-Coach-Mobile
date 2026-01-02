# 🔒 Uses Non-Exempt Encryption (UGS) - Explication

**Question posée par Apple lors de la soumission sur l'App Store Connect**

---

## 🎯 QU'EST-CE QUE C'EST?

**UGS** = **Uses Non-Exempt Encryption** (Utilise un chiffrement non exempté)

Apple demande si votre application utilise un chiffrement qui nécessite une déclaration d'exportation aux autorités américaines (Bureau of Industry and Security - BIS).

---

## ✅ RÉPONSE POUR VOTRE APP

### **Réponse: NON (false)**

Votre application utilise **uniquement**:
- ✅ **HTTPS/TLS** (chiffrement standard pour les communications réseau)
- ✅ **Chiffrement standard iOS/Android** (fourni par le système)

Ces types de chiffrement sont **exemptés** et ne nécessitent **pas** de déclaration.

---

## 📋 TYPES DE CHIFFREMENT

### ✅ EXEMPTÉS (pas besoin de déclaration)

Ces types de chiffrement sont **automatiquement exemptés**:

1. **HTTPS/TLS**
   - Utilisé pour toutes les communications API
   - Standard et exempté

2. **Chiffrement système**
   - Keychain (iOS)
   - Secure Storage (Android)
   - Fourni par le système d'exploitation

3. **Chiffrement standard**
   - AES (Advanced Encryption Standard)
   - Utilisé par défaut dans les frameworks

### ❌ NON EXEMPTÉS (nécessitent déclaration)

Ces types nécessitent une déclaration (votre app ne les utilise pas):

1. **Chiffrement personnalisé**
   - Algorithme de chiffrement créé par vous
   - Chiffrement non standard

2. **Chiffrement pour exportation**
   - Chiffrement destiné à être exporté vers d'autres pays
   - Chiffrement militaire

3. **Chiffrement de données sensibles**
   - Chiffrement de données gouvernementales
   - Chiffrement de données classifiées

---

## 🔍 VOTRE CONFIGURATION ACTUELLE

Dans votre `app.json`, vous avez déjà configuré:

```json
{
  "expo": {
    "ios": {
      "config": {
        "usesNonExemptEncryption": false
      }
    }
  }
}
```

**✅ C'est correct!** Votre app utilise uniquement du chiffrement exempté.

---

## 📝 RÉPONSE DANS APP STORE CONNECT

Lors de la soumission sur App Store Connect, Apple demande:

> **"Does your app use encryption?"**
> 
> **Réponse: OUI** (car vous utilisez HTTPS)
> 
> **"Does your app use non-exempt encryption?"**
> 
> **Réponse: NON** (car HTTPS est exempté)

---

## 🎯 POURQUOI APPLE DEMANDE ÇA?

Apple doit se conformer aux **réglementations d'exportation américaines** (Export Administration Regulations - EAR).

Si votre app utilise un chiffrement non exempté, vous devez:
1. Obtenir une licence d'exportation
2. Remplir des formulaires gouvernementaux
3. Obtenir l'approbation du BIS

**Mais pour votre app**: Pas nécessaire car vous utilisez uniquement du chiffrement exempté.

---

## ✅ CHECKLIST

Votre app utilise:
- [x] HTTPS pour les API (exempté)
- [x] Keychain pour stocker les tokens (exempté)
- [x] Chiffrement standard iOS/Android (exempté)
- [ ] Chiffrement personnalisé (NON)
- [ ] Chiffrement militaire (NON)
- [ ] Chiffrement pour exportation (NON)

**Conclusion**: ✅ **usesNonExemptEncryption: false** est correct!

---

## 🚀 LORS DE LA SOUMISSION

Dans App Store Connect, lors de la soumission:

1. **Question**: "Does your app use encryption?"
   - **Réponse**: **YES** (car HTTPS)

2. **Question**: "Does your app use non-exempt encryption?"
   - **Réponse**: **NO** (car HTTPS est exempté)

3. **Question**: "Does your app use encryption that is exempt?"
   - **Réponse**: **YES** (HTTPS est exempté)

**Résultat**: Pas besoin de licence d'exportation! ✅

---

## ⚠️ SI VOUS RÉPONDEZ MAL

### Si vous répondez "YES" par erreur:
- Apple vous demandera une licence d'exportation
- Vous devrez remplir des formulaires gouvernementaux
- Cela peut retarder la soumission de plusieurs semaines

### Si vous répondez "NO" alors que vous utilisez du chiffrement non exempté:
- Violation des réglementations d'exportation
- Risque de rejet de l'app
- Risque de sanctions

**Pour votre app**: Répondez **NO** car vous utilisez uniquement du chiffrement exempté.

---

## 📚 RÉFÉRENCES

- [Apple - Export Compliance](https://developer.apple.com/documentation/security/compiling_against_cryptographic_apis)
- [BIS - Export Administration Regulations](https://www.bis.doc.gov/index.php/policy-guidance/encryption)
- [Expo - usesNonExemptEncryption](https://docs.expo.dev/versions/latest/config/app/#usesnonexemptencryption)

---

## ✅ CONCLUSION

**Pour votre app LaSo Coach**:

- ✅ **usesNonExemptEncryption: false** est correct
- ✅ Vous utilisez uniquement HTTPS (exempté)
- ✅ Pas besoin de licence d'exportation
- ✅ Répondez "NO" dans App Store Connect

**C'est déjà configuré correctement dans votre `app.json`!** 🎉


