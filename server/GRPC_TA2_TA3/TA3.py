import grpc
import core_pb2
import core_pb2_grpc
from protobuf_to_dict import protobuf_to_dict # this library to converts python grpc messages to dict

from tornado import websocket, web, ioloop
import json

channel = grpc.insecure_channel('localhost:50051')
coreStub = core_pb2_grpc.CoreStub(channel)



class SocketHandler(websocket.WebSocketHandler):
    def check_origin(self, origin):
        return True

    def open(self):
        pass

    def on_close(self):
        pass

    def on_message(self, message):
        self.write_message(u"You said: " + message)
        message = json.loads(message)
        # CreatePipelines
        if message.type == "CreatePipelines":
            for PipelineCreateResult in coreStub.CreatePipelines(core_pb2.PipelineCreateRequest(**message["PipelineCreateRequest"])):
                ret = {"type":"PipelineCreateResult", "PipelineCreateResult": protobuf_to_dict(PipelineCreateResult)}
                self.write_message(json.dumps(ret))

        # ExecutePipeline
        elif message.type == "ExecutePipeline":
            for PipelineExecuteResult in coreStub.ExecutePipeline(core_pb2.PipelineExecuteRequest(**message["PipelineExecuteRequest"])):
                ret = {"type": "PipelineExecuteResult", "PipelineExecuteResult": protobuf_to_dict(PipelineExecuteResult)}
                self.write_message(json.dumps(ret))

        # ListPipelines
        elif message.type == "ListPipelines":
            PipelineListResult = coreStub.ListPipelines(core_pb2.PipelineListRequest(**message["PipelineListRequest"]))
            result = {"type": "PipelineListResult", "PipelineListResult": protobuf_to_dict(PipelineListResult)}
            self.write_message(json.dumps(result))

        # GetCreatePipelineResults
        elif message.type == "GetCreatePipelineResults":
            for PipelineCreateResult in coreStub.GetCreatePipelineResults(core_pb2.PipelineCreateResultsRequest(**message["PipelineCreateResultsRequest"])):
                ret = {"type": "PipelineCreateResult", "PipelineCreateResult":protobuf_to_dict(PipelineCreateResult)}
                self.write_message(json.dumps(ret))

        # GetExecutePipelineResults
        elif message.type == "GetExecutePipelineResults":
            for PipelineExecuteResult in coreStub.GetExecutePipelineResults(core_pb2.PipelineExecuteResultsRequest(**message["PipelineExecuteResultsRequest"])):
                ret = {"type": "PipelineExecuteResult", "PipelineExecuteResult": protobuf_to_dict(PipelineExecuteResult)}
                self.write_message(json.dumps(ret))

        # UpdateProblemSchema
        elif message.type == "UpdateProblemSchema":
            Response = coreStub.UpdateProblemSchema(core_pb2.UpdateProblemSchemaRequest(**message["UpdateProblemSchemaRequest"]))
            ret = {"type": "Response", "Response": protobuf_to_dict(Response)}
            self.write_message(json.dumps(ret))

        # StartSession
        elif message.type == "StartSession"
            SessionResponse = coreStub.StartSession(core_pb2.SessionRequest(**message["SessionRequest"]))
            ret = {"type": "SessionResponse", "SessionResponse": protobuf_to_dict(SessionResponse)}
            self.write_message(json.dumps(ret))

        # EndSession
        elif message.type == "EndSession":
            Response = coreStub.EndSession(core_pb2.Response(**message["Response"]));
            ret =  {"type": "Response", "Response": protobuf_to_dict(Response)}
            self.write_message(json.dumps(ret))


app = web.Application([
    (r'/ws', SocketHandler)
])



if __name__ == '__main__':
    app.listen(8888)
    ioloop.IOLoop.instance().start()






















# __version__ = '0.1'


# if __name__ == '__main__':
#     channel = grpc.insecure_channel('localhost:50051')
#     stub = pb_core_grpc.PipelineComputeStub(channel)

#     version = pb_core.DESCRIPTOR.GetOptions().Extensions[
#         pb_core.protocol_version]

#     reply = stub.StartSession(pb_core.SessionRequest(
#         user_agent='text_client %s' % __version__,
#         version=version,
#     ))
#     context = reply.context
#     print "Started session %r, status %s" % (context.session_id,
#                                              reply.response_info.status.code)

#     reply_stream = stub.CreatePipelines(pb_core.PipelineCreateRequest(
#         context=context,
#         train_features=[
#             pb_core.Feature(feature_id='feature1',
#                            data_uri='file:///data/feature1.csv'),
#             pb_core.Feature(feature_id='feature2',
#                            data_uri='file:///data/feature2.csv'),
#         ],
#         task=pb_core.CLASSIFICATION,
#         task_subtype=pb_core.NONE,
#         task_description="Debugging task",
#         output=pb_core.FILE,
#         metrics=[
#             pb_core.ACCURACY,
#             pb_core.ROC_AUC,
#         ],
#         target_features=[
#             pb_core.Feature(feature_id='targetfeature',
#                            data_uri='file:///data/targetfeature.csv'),
#         ],
#         max_pipelines=10,
#     ))
#     print("Requested pipelines")
#     pipelines = set()
#     for result in reply_stream:
#         if result.response_info.status.code == pb_core.CANCELLED:
#             print "Pipelines creation cancelled"
#             break
#         elif result.response_info.status.code != pb_core.OK:
#             print "Error during pipelines creation"
#             if result.response_info.status.details:
#                 print "details: %r" % result.response_info.status.details
#             break
#         progress = result.progress_info
#         pipeline_id = result.pipeline_id
#         pipeline = result.pipeline_info
#         if not result.HasField('pipeline_info'):
#             pipeline = None

#         print "%s %s %s" % (progress, pipeline_id, pipeline)
#         if progress == pb_core.COMPLETED:
#             pipelines.add(pipeline_id)

#     for pipeline_id in pipelines:
#         print "Executing pipeline %s" % pipeline_id
#         reply_stream = stub.ExecutePipeline(pb_core.PipelineExecuteRequest(
#             context=context,
#             pipeline_id=pipeline_id,
#         ))
#         for result in reply_stream:
#             if result.response_info.status.code == pb_core.CANCELLED:
#                 print "Pipeline execution cancelled"
#                 break
#             elif result.response_info.status.code != pb_core.OK:
#                 print "Error during pipeline execution"
#                 if result.response_info.status.details:
#                     print "details: %r" % result.response_info.status.details
#                 break
#             progress = result.progress_info
#             assert result.pipeline_id == pipeline_id
#             print "%s %s" % (progress, pipeline_id)
#             if progress == pb_core.COMPLETED:
#                 print "Pipeline execution completed"

#     reply = stub.EndSession(context)
#     print "Ended session %r, status %s" % (context.session_id,
#                                            reply.status.code)
