import { describe, it, expect } from "vitest";
import {
  submitKYC,
  adminUpdateKYC,
  assertKYCVerifiedForWithdrawal,
  logAMLMovement,
  listAMLLogs
} from "@/lib/kyc/kyc-service";

describe("Système de Conformité KYC & Traçabilité AML", () => {
  const testUserId = "user-test-kyc-" + Date.now();

  it("bloque les retraits si le profil KYC n'a pas été soumis", async () => {
    await expect(
      assertKYCVerifiedForWithdrawal(testUserId, {
        movementType: "retrait_wallet",
        amount: 25000,
        ipAddress: "127.0.0.1",
        userAgent: "Vitest Agent"
      })
    ).rejects.toThrow("Conformité KYC/AML obligatoire");
  });

  it("permet la soumission d'un dossier KYC particulier avec CNI et selfie", async () => {
    const profile = await submitKYC(
      testUserId,
      "testeur@envol.com",
      "Conforme Testeur",
      {
        profileType: "particulier",
        nom: "Testeur",
        prenom: "Conforme",
        pieceIdentiteType: "cni",
        pieceIdentiteNumero: "1234567890",
        pieceIdentiteUrl: "https://example.com/cni-recto.jpg",
        selfieUrl: "https://example.com/selfie.jpg",
        telephone: "+22997000000"
      },
      "192.168.1.50",
      "Vitest Runner"
    );

    expect(profile.statut).toBe("en_attente");
    expect(profile.pieceIdentiteUrl).toBe("https://example.com/cni-recto.jpg");
    expect(profile.selfieUrl).toBe("https://example.com/selfie.jpg");

    // Un dossier en attente ne doit toujours pas autoriser les retraits
    await expect(
      assertKYCVerifiedForWithdrawal(testUserId, {
        movementType: "retrait_wallet",
        amount: 25000,
        ipAddress: "192.168.1.50"
      })
    ).rejects.toThrow("en cours de validation");
  });

  it("permet à l'administrateur d'approuver un dossier et débloque les retraits", async () => {
    const updated = await adminUpdateKYC(testUserId, "approuve", "admin-1");
    expect(updated.statut).toBe("approuve");
    expect(updated.verifiePar).toBe("admin-1");

    // Vérifie que les retraits sont maintenant autorisés
    const profile = await assertKYCVerifiedForWithdrawal(testUserId, {
      movementType: "retrait_wallet",
      amount: 25000,
      ipAddress: "192.168.1.50"
    });
    expect(profile.statut).toBe("approuve");
  });

  it("permet le rejet avec motif obligatoire et bloque à nouveau les retraits", async () => {
    const rejected = await adminUpdateKYC(testUserId, "rejete", "admin-1", "CNI floue et illisible");
    expect(rejected.statut).toBe("rejete");
    expect(rejected.motifRejet).toBe("CNI floue et illisible");

    await expect(
      assertKYCVerifiedForWithdrawal(testUserId, {
        movementType: "retrait_wallet",
        amount: 25000,
        ipAddress: "192.168.1.50"
      })
    ).rejects.toThrow("a été rejeté");
  });

  it("enregistre les mouvements financiers dans le registre d'audit AML avec IP légale", async () => {
    const log = await logAMLMovement({
      userId: testUserId,
      type: "retrait_wallet",
      montant: 50000,
      devise: "XOF",
      ipAddress: "102.164.88.12",
      userAgent: "Mozilla/5.0 Test",
      kycVerified: true,
      statut: "autorise",
      details: { withdrawalId: "wd-789", method: "MTN Mobile Money" }
    });

    expect(log.id).toBeDefined();
    expect(log.ipAddress).toBe("102.164.88.12");
    expect(log.montant).toBe(50000);

    const logs = await listAMLLogs();
    const found = logs.find((l) => l.id === log.id);
    expect(found).toBeDefined();
    expect(found?.ipAddress).toBe("102.164.88.12");
  });
});
