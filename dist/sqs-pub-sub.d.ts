import { SQS } from "aws-sdk";
import { PubSubEngine } from "graphql-subscriptions";
export declare class SQSPubSub implements PubSubEngine {
    sqs: SQS;
    private queueUrl;
    private stopped;
    private triggerName;
    private isNoDeleteQueue;
    constructor(config?: SQS.Types.ClientConfiguration, queueUrl?: string | null);
    asyncIterator: <T>(triggers: string | string[]) => AsyncIterator<T, any, undefined>;
    createQueue: (queueUrl?: string) => Promise<void>;
    deleteQueue: () => Promise<void>;
    deleteMessage: (receiptHandle: string) => Promise<void>;
    publish: (triggerName: string, payload: any) => Promise<void>;
    subscribe: (triggerName: string, onMessage: Function) => Promise<number>;
    unsubscribe: () => Promise<void>;
    private readonly poll;
    private readonly receiveMessage;
}
