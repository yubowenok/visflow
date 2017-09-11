import grpc
from ta3ta2_api import core_pb2, core_pb2_grpc
from protobuf_to_dict import protobuf_to_dict, dict_to_protobuf # this library to converts python grpc messages to dict
from enum import Enum
from tornado import websocket, web, ioloop
import json


channel = grpc.insecure_channel('localhost:50051')
coreStub = core_pb2_grpc.CoreStub(channel)


MESSAGE_TYPE = {
    'BLOCKING': 'BLOCKING',
    'STREAMING': 'STREAMING'
}


grpcCall = {
    # rpc CreatePipelines(PipelineCreateRequest) returns (stream PipelineCreateResult) {}
    'CreatePipelines': 
        {
            'function': coreStub.CreatePipelines,
            'input': core_pb2.PipelineCreateRequest,
            'inputType': MESSAGE_TYPE['BLOCKING'],
            'outputType': MESSAGE_TYPE['STREAMING']
        },

    # rpc ExecutePipeline(PipelineExecuteRequest) returns (stream PipelineExecuteResult) {}
    'ExecutePipeline': 
        {
            'function': coreStub.ExecutePipeline,
            'input': core_pb2.PipelineExecuteRequest,
            'inputType': MESSAGE_TYPE['BLOCKING'],
            'outputType': MESSAGE_TYPE['STREAMING']
        },

    # rpc ListPipelines(PipelineListRequest) returns (PipelineListResult) {}
    'ListPipelines': 
        {
            'function': coreStub.ListPipelines,
            'input': core_pb2.PipelineListRequest,
            'inputType': MESSAGE_TYPE['BLOCKING'],
            'outputType': MESSAGE_TYPE['BLOCKING']
        },

    # rpc GetCreatePipelineResults(PipelineCreateResultsRequest) returns (stream PipelineCreateResult) {}
    'GetCreatePipelineResults': 
        {
            'function': coreStub.GetCreatePipelineResults,
            'input': core_pb2.PipelineCreateResultsRequest,
            'inputType': MESSAGE_TYPE['BLOCKING'],
            'outputType': MESSAGE_TYPE['STREAMING']
        },

    # rpc GetExecutePipelineResults(PipelineExecuteResultsRequest) returns (stream PipelineExecuteResult) {}
    'GetExecutePipelineResults':
        {
            'function': coreStub.GetExecutePipelineResults,
            'input': core_pb2.PipelineExecuteResultsRequest,
            'inputType': MESSAGE_TYPE['BLOCKING'],
            'outputType': MESSAGE_TYPE['STREAMING']
        },

    # rpc UpdateProblemSchema(UpdateProblemSchemaRequest) returns (Response) {}
    'UpdateProblemSchema': 
        {
            'function': coreStub.UpdateProblemSchema,
            'input': core_pb2.UpdateProblemSchemaRequest,
            'inputType': MESSAGE_TYPE['BLOCKING'],
            'outputType': MESSAGE_TYPE['BLOCKING']
        },

    # rpc StartSession(SessionRequest) returns (SessionResponse) {}
    'StartSession':
        {
            'function': coreStub.StartSession,
            'input': core_pb2.SessionRequest,
            'inputType': MESSAGE_TYPE['BLOCKING'],
            'outputType': MESSAGE_TYPE['BLOCKING']
        },


    # rpc EndSession(SessionContext) returns (Response) {}
    'EndSession':
        {
            'function': coreStub.EndSession,
            'input': core_pb2.SessionContext,
            'inputType': MESSAGE_TYPE['BLOCKING'],
            'outputType': MESSAGE_TYPE['BLOCKING']
        }

}

# WebSocket message request format:
# 
# {
#   fname: 'function name to be called by grpc',
#   rid: 'requestId'
#   object: !{object_definition}
# }
#
#
# WebSocket message response format:
#
# {
#   rid: 'request id -> same as requested',
#   'object': !{object_definition}
# }


class SocketHandler(websocket.WebSocketHandler):
    def check_origin(self, origin):
        return True

    def open(self):
        pass

    def on_close(self):
        pass

    def on_message(self, message):
        message = json.loads(message)

        call = grpcCall[message['fname']]

        if call['inputType'] == MESSAGE_TYPE['BLOCKING']:
            grpc_input = dict_to_protobuf(call['input'], message['object'])
            if call['outputType'] == MESSAGE_TYPE['BLOCKING']:
                response = call['function'](grpc_input)
                ret = {'rid':message['rid'], 'object': protobuf_to_dict(response)}
                self.write_message(json.dumps(ret))
            else: #call['outputType'] == MESSAGE_TYPE['STREAMING']
                for response in call['function'](grpc_input):
                    ret = {'rid':message['rid'], 'object': protobuf_to_dict(response)}
                    self.write_message(json.dumps(ret))
        else: # call['inputType'] == MESSAGE_TYPE['STREAMING']):
            raise NotImplementedError('Streaming input not supported')

app = web.Application([
    (r'/ws', SocketHandler)
])



if __name__ == '__main__':
    app.listen(8888)
    ioloop.IOLoop.instance().start()

