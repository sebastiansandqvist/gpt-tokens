"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GPTTokens = void 0;
const js_tiktoken_1 = require("js-tiktoken");
const decimal_js_1 = __importDefault(require("decimal.js"));
class GPTTokens {
    constructor(options) {
        // https://openai.com/pricing/
        // gpt-3.5-turbo
        // $0.002 / 1K tokens
        this.gpt3_5_turboTokenUnit = new decimal_js_1.default(0.002).div(1000).toNumber();
        // https://openai.com/pricing/
        // gpt-3.5-turbo-16k
        // Prompt: $0.003 / 1K tokens
        this.gpt3_5_turbo_16kPromptTokenUnit = new decimal_js_1.default(0.003).div(1000).toNumber();
        // https://openai.com/pricing/
        // gpt-3.5-turbo-16k
        // Prompt: $0.004 / 1K tokens
        this.gpt3_5_turbo_16kCompletionTokenUnit = new decimal_js_1.default(0.004).div(1000).toNumber();
        // https://openai.com/pricing/
        // gpt-4-8k
        // Prompt: $0.03 / 1K tokens
        //
        this.gpt4_8kPromptTokenUnit = new decimal_js_1.default(0.03).div(1000).toNumber();
        // https://openai.com/pricing/
        // gpt-4-8k
        // Completion: $0.06 / 1K tokens
        this.gpt4_8kCompletionTokenUnit = new decimal_js_1.default(0.06).div(1000).toNumber();
        // https://openai.com/pricing/
        // gpt-4-32k
        // Prompt: $0.06 / 1K tokens
        this.gpt4_32kPromptTokenUnit = new decimal_js_1.default(0.06).div(1000).toNumber();
        // https://openai.com/pricing/
        // gpt-4-32k
        // Completion: $0.12 / 1K tokens
        this.gpt4_32kCompletionTokenUnit = new decimal_js_1.default(0.12).div(1000).toNumber();
        const { model, messages, plus = false, } = options;
        if (model === 'gpt-3.5-turbo')
            this.warning(`${model} may update over time. Returning num tokens assuming gpt-3.5-turbo-0613`);
        if (model === 'gpt-3.5-turbo-16k')
            this.warning(`${model} may update over time. Returning num tokens assuming gpt-3.5-turbo-16k-0613`);
        if (model === 'gpt-4')
            this.warning(`${model} may update over time. Returning num tokens assuming gpt-4-0613`);
        if (model === 'gpt-4-32k')
            this.warning(`${model} may update over time. Returning num tokens assuming gpt-4-32k-0613`);
        this.model = model;
        this.plus = plus;
        this.messages = messages;
    }
    // Used Tokens
    get usedTokens() {
        return this.num_tokens_from_messages(this.messages, this.model);
    }
    // Used USD
    get usedUSD() {
        let price = 0;
        if ([
            'gpt-3.5-turbo',
            'gpt-3.5-turbo-0301',
            'gpt-3.5-turbo-0613',
        ].includes(this.model))
            price = new decimal_js_1.default(this.usedTokens)
                .mul(this.gpt3_5_turboTokenUnit)
                .toNumber();
        if ([
            'gpt-3.5-turbo-16k',
            'gpt-3.5-turbo-16k-0613',
        ].includes(this.model)) {
            const promptUSD = new decimal_js_1.default(this.promptUsedTokens)
                .mul(this.gpt3_5_turbo_16kPromptTokenUnit);
            const completionUSD = new decimal_js_1.default(this.completionUsedTokens)
                .mul(this.gpt3_5_turbo_16kCompletionTokenUnit);
            price = promptUSD.add(completionUSD).toNumber();
        }
        if ([
            'gpt-4',
            'gpt-4-0314',
            'gpt-4-0613',
        ].includes(this.model)) {
            const promptUSD = new decimal_js_1.default(this.promptUsedTokens)
                .mul(this.gpt4_8kPromptTokenUnit);
            const completionUSD = new decimal_js_1.default(this.completionUsedTokens)
                .mul(this.gpt4_8kCompletionTokenUnit);
            price = promptUSD.add(completionUSD).toNumber();
        }
        if ([
            'gpt-4-32k',
            'gpt-4-32k-0314',
            'gpt-4-32k-0613',
        ].includes(this.model)) {
            const promptUSD = new decimal_js_1.default(this.promptUsedTokens)
                .mul(this.gpt4_32kPromptTokenUnit);
            const completionUSD = new decimal_js_1.default(this.completionUsedTokens)
                .mul(this.gpt4_32kCompletionTokenUnit);
            price = promptUSD.add(completionUSD).toNumber();
        }
        return this.plus && this.model.startsWith('gpt-3.5-turbo')
            ? new decimal_js_1.default(price).mul(0.75).toNumber()
            : price;
    }
    get promptUsedTokens() {
        const messages = this.messages.filter(item => item.role !== 'assistant');
        return this.num_tokens_from_messages(messages, this.model);
    }
    get completionUsedTokens() {
        const messages = this.messages.filter(item => item.role === 'assistant');
        return this.num_tokens_from_messages(messages, this.model);
    }
    /**
     * Print a warning message.
     * @param message The message to print. Will be prefixed with "Warning: ".
     * @returns void
     */
    warning(message) {
        console.warn('Warning:', message);
    }
    /**
     * Return the number of tokens in a list of messages.
     * @param messages A list of messages.
     * @param model The model to use for encoding.
     * @returns The number of tokens in the messages.
     * @throws If the model is not supported.
     */
    num_tokens_from_messages(messages, model) {
        let encoding;
        let tokens_per_message;
        let tokens_per_name;
        let num_tokens = 0;
        if ([
            'gpt-3.5-turbo-0301',
        ].includes(model)) {
            tokens_per_message = 4;
            tokens_per_name = -1;
        }
        if ([
            'gpt-3.5-turbo',
            'gpt-3.5-turbo-0613',
            'gpt-3.5-turbo-16k',
            'gpt-3.5-turbo-16k-0613',
            'gpt-4',
            'gpt-4-0314',
            'gpt-4-0613',
            'gpt-4-32k',
            'gpt-4-32k-0314',
            'gpt-4-32k-0613',
        ].includes(model)) {
            tokens_per_message = 3;
            tokens_per_name = 1;
        }
        try {
            encoding = (0, js_tiktoken_1.encodingForModel)(model);
        }
        catch (e) {
            this.warning('model not found. Using cl100k_base encoding.');
            encoding = (0, js_tiktoken_1.getEncoding)('cl100k_base');
        }
        // Python 2 Typescript by gpt-4
        for (const message of messages) {
            num_tokens += tokens_per_message;
            for (const [key, value] of Object.entries(message)) {
                num_tokens += encoding.encode(value).length;
                if (key === 'name') {
                    num_tokens += tokens_per_name;
                }
            }
        }
        // Supplementary
        // encoding.free()
        // every reply is primed with <|start|>assistant<|message|>
        return num_tokens + 3;
    }
}
exports.GPTTokens = GPTTokens;
