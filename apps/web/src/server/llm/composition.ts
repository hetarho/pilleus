import type { LlmCredentialResolver } from "../shared/llm";
import { ConnectLlmCredentialUseCase } from "./application/use-cases/connect-llm-credential";
import { DisconnectLlmCredentialUseCase } from "./application/use-cases/disconnect-llm-credential";
import { ListLlmCredentialsUseCase } from "./application/use-cases/list-llm-credentials";
import { GetLlmCatalogUseCase } from "./application/get-llm-catalog";
import { ResolveLlmProviderUseCase } from "./application/resolve-llm-provider";
import { AesKeyCipher } from "./infrastructure/crypto/aes-key-cipher";
import { ChainedCredentialResolver } from "./infrastructure/chained-credential-resolver";
import { EnvCredentialResolver } from "./infrastructure/env-credential-resolver";
import { LlmProviderRegistry } from "./infrastructure/provider-registry";
import { DrizzleLlmCredentialRepository } from "./infrastructure/repositories/drizzle-llm-credential-repository";
import { StoreCredentialResolver } from "./infrastructure/store-credential-resolver";

/**
 * Composition root for the `llm` context. All wiring of concrete adapters
 * lives here; routers call the exported factories and never touch infra.
 *
 * Credential resolution order (BYOK): the user's connected & decrypted key
 * (store) first, then a shared dev key (env) as a local-dev fallback. In
 * production the env resolver returns null, so only real BYOK keys run.
 */
const keyCipher = new AesKeyCipher();
const credentialRepository = new DrizzleLlmCredentialRepository();
const providerRegistry = new LlmProviderRegistry();

const credentialResolver: LlmCredentialResolver = new ChainedCredentialResolver([
  new StoreCredentialResolver(credentialRepository, keyCipher),
  new EnvCredentialResolver(),
]);

export function resolveLlmProviderUseCase(): ResolveLlmProviderUseCase {
  return new ResolveLlmProviderUseCase(credentialResolver, providerRegistry);
}

export function getLlmCatalogUseCase(): GetLlmCatalogUseCase {
  return new GetLlmCatalogUseCase(credentialResolver);
}

export function connectLlmCredentialUseCase(): ConnectLlmCredentialUseCase {
  return new ConnectLlmCredentialUseCase(credentialRepository, keyCipher);
}

export function disconnectLlmCredentialUseCase(): DisconnectLlmCredentialUseCase {
  return new DisconnectLlmCredentialUseCase(credentialRepository);
}

export function listLlmCredentialsUseCase(): ListLlmCredentialsUseCase {
  return new ListLlmCredentialsUseCase(credentialRepository);
}
