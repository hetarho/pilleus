import { loadOwnedProduct } from "./load-owned-product";
import type { ProductRepository } from "../domain/repositories/product-repository";
import type { BenefitRepository } from "../domain/repositories/benefit-repository";
import type { PersonaRepository } from "../domain/repositories/persona-repository";
import type { PolicyRepository } from "../../policy/domain/repositories/policy-repository";

/** Read model assembled for LLM prompts: the product's Intent (mission, benefits,
 * personas) plus its product-wide principles. A cross-context read — benefits and
 * personas come from this context, principles are the `product`-category policies
 * from the policy context — so prompt builders depend on one shape, not five repos. */
export interface ProductPromptContext {
  name: string;
  description: string | null;
  mission: string | null;
  benefits: string[];
  personas: string[];
  principles: string[];
}

/** Empty Intent context — for code paths that only PARSE an LLM response.
 * parseResponse ignores the product context (it's shared with buildPrompt via
 * one input type), so parse-only call sites pass this instead of loading repos. */
export const EMPTY_PROMPT_CONTEXT: ProductPromptContext = {
  name: "",
  description: null,
  mission: null,
  benefits: [],
  personas: [],
  principles: [],
};

export interface ProductPromptContextRepos {
  products: ProductRepository;
  benefits: BenefitRepository;
  personas: PersonaRepository;
  policies: PolicyRepository;
}

export async function loadProductPromptContext(
  repos: ProductPromptContextRepos,
  productId: string,
  userId: string,
): Promise<ProductPromptContext> {
  const product = await loadOwnedProduct(repos.products, productId, userId);
  const [benefits, personas, policies] = await Promise.all([
    repos.benefits.findByProductId(productId),
    repos.personas.findByProductId(productId),
    repos.policies.findByProductId(productId),
  ]);
  return {
    name: product.name.value,
    description: product.description,
    mission: product.mission,
    benefits: benefits.map((b) => b.label),
    personas: personas.map((p) => p.label),
    principles: policies.filter((p) => p.category === "product").map((p) => p.title),
  };
}
