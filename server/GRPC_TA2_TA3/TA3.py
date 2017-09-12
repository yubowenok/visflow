import grpc
from ta3ta2_api import core_pb2, core_pb2_grpc, dataflow_ext_pb2, dataflow_ext_pb2_grpc, data_ext_pb2, data_ext_pb2_grpc
from protobuf_to_dict import protobuf_to_dict, dict_to_protobuf # this library to converts python grpc messages to dict
from enum import Enum
from tornado import websocket, web, ioloop
import json


channel = grpc.insecure_channel('localhost:50051')
coreStub = core_pb2_grpc.CoreStub(channel)
dataflow_extStub = dataflow_ext_pb2_grpc.DataflowExtStub(channel)
data_extStub = data_ext_pb2_grpc.DataExtStub(channel)


MESSAGE_TYPE = {
    'BLOCKING': 'BLOCKING',
    'STREAMING': 'STREAMING'
}


grpcCall = {

    #####################################################################################
    # core.proto
    #

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
        },

    #####################################################################################
    # dataflow_ext.proto
    #

    # rpc DescribeDataflow(PipelineReference) returns (DataflowDescription) {}
    'DescribeDataflow':
        {
            'function': dataflow_extStub.DescribeDataflow,
            'input': dataflow_ext_pb2.PipelineReference,
            'inputType': MESSAGE_TYPE['BLOCKING'],
            'outputType': MESSAGE_TYPE['BLOCKING']
        },

    # rpc GetDataflowResults(PipelineReference) returns (stream ModuleResult) {}
    'GetDataflowResults':
        {
            'function': dataflow_extStub.GetDataflowResults,
            'input': dataflow_ext_pb2.PipelineReference,
            'inputType': MESSAGE_TYPE['BLOCKING'],
            'outputType': MESSAGE_TYPE['STREAMING']
        },


    #####################################################################################
    # data_ext.proto
    #


    # rpc AddFeatures(AddFeaturesRequest) returns (Response) {}
    'AddFeatures':
        {
            'function': data_extStub.AddFeatures,
            'input': data_ext_pb2.AddFeaturesRequest,
            'inputType': MESSAGE_TYPE['BLOCKING'],
            'outputType': MESSAGE_TYPE['BLOCKING']
        },

    # rpc RemoveFeatures(RemoveFeaturesRequest) returns (Response) {}
    'RemoveFeatures':
        {
            'function': data_extStub.RemoveFeatures,
            'input': data_ext_pb2.RemoveFeaturesRequest,
            'inputType': MESSAGE_TYPE['BLOCKING'],
            'outputType': MESSAGE_TYPE['BLOCKING']
        },
    
    # rpc AddSamples(AddSamplesRequest) returns (Response) {}
    'AddSamples':
        {
            'function': data_extStub.AddSamples,
            'input': data_ext_pb2.AddSamplesRequest,
            'inputType': MESSAGE_TYPE['BLOCKING'],
            'outputType': MESSAGE_TYPE['BLOCKING']
        },

    # rpc RemoveSamples(RemoveSamplesRequest) returns (Response) {}
    'RemoveSamples':
        {
            'function': data_extStub.RemoveSamples,
            'input': data_ext_pb2.RemoveSamplesRequest,
            'inputType': MESSAGE_TYPE['BLOCKING'],
            'outputType': MESSAGE_TYPE['BLOCKING']
        },
    
    # rpc ReplaceData(ReplaceDataRequest) returns (Response) {}
    'ReplaceData':
        {
            'function': data_extStub.ReplaceData,
            'input': data_ext_pb2.ReplaceDataRequest,
            'inputType': MESSAGE_TYPE['BLOCKING'],
            'outputType': MESSAGE_TYPE['BLOCKING']
        },
    
    # rpc Materialize(MaterializeRequest) returns (Response) {}
    'Materialize':
        {
            'function': data_extStub.Materialize,
            'input': data_ext_pb2.MaterializeRequest,
            'inputType': MESSAGE_TYPE['BLOCKING'],
            'outputType': MESSAGE_TYPE['BLOCKING']
        },
    
    
    # rpc TrainValidationSplit(TrainValidationSplitRequest) returns (Response) {}
    'TrainValidationSplit':
        {
            'function': data_extStub.TrainValidationSplit,
            'input': data_ext_pb2.TrainValidationSplitRequest,
            'inputType': MESSAGE_TYPE['BLOCKING'],
            'outputType': MESSAGE_TYPE['BLOCKING']
        },
    
    # rpc Revert(RevertRequest) returns (Response) {}
    'Revert':
        {
            'function': data_extStub.Revert,
            'input': data_ext_pb2.RevertRequest,
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

        gc = grpcCall[message['fname']]

        if gc['inputType'] == MESSAGE_TYPE['BLOCKING']:
            grpc_input = dict_to_protobuf(gc['input'], message['object'])
            if gc['outputType'] == MESSAGE_TYPE['BLOCKING']:
                response = gc['function'](grpc_input)
                ret = {'rid':message['rid'], 'object': protobuf_to_dict(response)}
                self.write_message(json.dumps(ret))
            else: #gc['outputType'] == MESSAGE_TYPE['STREAMING']
                for response in gc['function'](grpc_input):
                    ret = {'rid':message['rid'], 'object': protobuf_to_dict(response)}
                    self.write_message(json.dumps(ret))
        else: # gc['inputType'] == MESSAGE_TYPE['STREAMING']):
            raise NotImplementedError('Streaming input not supported')

app = web.Application([
    (r'/ws', SocketHandler)
])



if __name__ == '__main__':
    app.listen(8888)
    ioloop.IOLoop.instance().start()

