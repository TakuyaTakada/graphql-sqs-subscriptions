"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const pubsub_async_iterator_1 = require("graphql-subscriptions/dist/pubsub-async-iterator");
const uuid_1 = __importDefault(require("uuid"));
const utils_1 = require("./utils");
const AWS_SDK_API_VERSION = "2012-11-05";
const PUB_SUB_MESSAGE_ATTRIBUTE = "SQSPubSubTriggerName";
class SQSPubSub {
    constructor(config = {}, queueUrl = null) {
        this.asyncIterator = (triggers) => {
            return new pubsub_async_iterator_1.PubSubAsyncIterator(this, triggers);
        };
        this.createQueue = (queueUrl = null) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                QueueName: queueUrl
                    ? queueUrl
                    : `${process.env.NODE_ENV || "local"}-${uuid_1.default()}.fifo`,
                Attributes: {
                    FifoQueue: "true"
                }
            };
            try {
                yield this.sqs
                    .createQueue(params, (err, { QueueUrl = "" }) => {
                    if (err) {
                        console.error(err);
                    }
                    this.queueUrl = QueueUrl;
                })
                    .promise();
            }
            catch (error) {
                console.error(error);
            }
        });
        this.deleteQueue = () => __awaiter(this, void 0, void 0, function* () {
            const params = {
                QueueUrl: this.queueUrl
            };
            try {
                yield this.sqs.deleteQueue(params, utils_1.errorHandler).promise();
                this.queueUrl = null;
            }
            catch (error) {
                console.error(error);
            }
        });
        this.deleteMessage = (receiptHandle) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                QueueUrl: this.queueUrl,
                ReceiptHandle: receiptHandle
            };
            try {
                yield this.sqs.deleteMessage(params, utils_1.errorHandler).promise();
            }
            catch (error) {
                console.error(error);
            }
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.publish = (triggerName, payload) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.queueUrl) {
                    yield this.createQueue();
                }
                const params = {
                    QueueUrl: this.queueUrl,
                    MessageBody: JSON.stringify(payload),
                    MessageGroupId: triggerName,
                    MessageDeduplicationId: uuid_1.default(),
                    MessageAttributes: {
                        [PUB_SUB_MESSAGE_ATTRIBUTE]: {
                            DataType: "String",
                            StringValue: triggerName
                        }
                    }
                };
                yield this.sqs.sendMessage(params, utils_1.errorHandler).promise();
            }
            catch (error) {
                console.error(error);
            }
        });
        this.subscribe = (triggerName, onMessage) => {
            try {
                this.poll(triggerName, onMessage);
                return Promise.resolve(1);
            }
            catch (error) {
                console.error(error);
            }
        };
        this.unsubscribe = () => __awaiter(this, void 0, void 0, function* () {
            if (!this.stopped) {
                this.stopped = true;
                try {
                    yield this.deleteQueue();
                }
                catch (error) {
                    console.error(error);
                }
                this.stopped = false;
            }
        });
        this.poll = (triggerName, onMessage) => __awaiter(this, void 0, void 0, function* () {
            if (this.stopped) {
                return;
            }
            try {
                if (!this.queueUrl) {
                    yield this.createQueue();
                }
                const params = {
                    MessageAttributeNames: [PUB_SUB_MESSAGE_ATTRIBUTE],
                    QueueUrl: this.queueUrl
                };
                const data = yield this.receiveMessage(params);
                if (data &&
                    data.Messages &&
                    data.Messages[0].MessageAttributes[PUB_SUB_MESSAGE_ATTRIBUTE]
                        .StringValue === triggerName) {
                    yield this.deleteMessage(data.Messages[0].ReceiptHandle);
                    onMessage(JSON.parse(data.Messages[0].Body));
                }
            }
            catch (error) {
                console.error(error);
            }
            setImmediate(() => this.poll(triggerName, onMessage));
        });
        this.receiveMessage = (params) => __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.sqs.receiveMessage(params, utils_1.errorHandler).promise();
            }
            catch (error) {
                console.error(error);
            }
        });
        aws_sdk_1.default.config.update(config);
        this.sqs = new aws_sdk_1.default.SQS({ apiVersion: AWS_SDK_API_VERSION });
        if (queueUrl) {
            this.createQueue(queueUrl)
                .then(() => {
                this.queueUrl = queueUrl;
            })
                .catch(err => {
                console.error(err);
            });
        }
    }
}
exports.SQSPubSub = SQSPubSub;
//# sourceMappingURL=sqs-pub-sub.js.map