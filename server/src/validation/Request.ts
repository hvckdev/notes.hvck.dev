import {
  IsBase64,
  IsHexadecimal,
  IsIn,
  IsNotEmpty,
  Matches,
  ValidateIf,
} from "class-validator";

const SUPPORTED_CRYPTO_VERSIONS = ["v2", "v3"] as const;

abstract class NoteRequestBody {
  @ValidateIf((o) => o.user_id != null)
  @IsHexadecimal()
  user_id: string | undefined;

  @ValidateIf((o) => o.plugin_version != null)
  @Matches("^[0-9]+\\.[0-9]+\\.[0-9]+$")
  plugin_version: string | undefined;
}

export class NotePostRequest extends NoteRequestBody {
  @IsBase64()
  @IsNotEmpty()
  ciphertext: string | undefined;

  @IsBase64()
  @ValidateIf((o) => o.crypto_version === "v2")
  @IsNotEmpty()
  hmac?: string | undefined;

  @IsBase64()
  @ValidateIf((o) => o.crypto_version === "v3")
  @IsNotEmpty()
  iv?: string | undefined;

  @IsIn(SUPPORTED_CRYPTO_VERSIONS)
  crypto_version: string = "v3";
}

export class NoteDeleteRequest extends NoteRequestBody {
  @IsBase64()
  @IsNotEmpty()
  secret_token: string | undefined;
}

/** Payload used to finalize an AES-GCM draft after attachment IDs are known. */
export class NotePutRequest extends NoteRequestBody {
  @IsBase64()
  @IsNotEmpty()
  ciphertext: string | undefined;

  @IsBase64()
  @IsNotEmpty()
  iv: string | undefined;

  @IsBase64()
  @IsNotEmpty()
  secret_token: string | undefined;

  @IsIn(["v3"])
  crypto_version: string = "v3";
}

export class AttachmentPostRequest {
  @IsBase64()
  @IsNotEmpty()
  ciphertext: string | undefined;

  @IsBase64()
  @IsNotEmpty()
  iv: string | undefined;

  @IsBase64()
  @IsNotEmpty()
  secret_token: string | undefined;
}
