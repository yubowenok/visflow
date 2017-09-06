import grpc
import d3m_ta2_vistrails.proto.pipeline_service_pb2 as pb_core
import d3m_ta2_vistrails.proto.pipeline_service_pb2_grpc as pb_core_grpc


__version__ = '0.1'


if __name__ == '__main__':
    channel = grpc.insecure_channel('localhost:50051')
    stub = pb_core_grpc.PipelineComputeStub(channel)

    version = pb_core.DESCRIPTOR.GetOptions().Extensions[
        pb_core.protocol_version]

    reply = stub.StartSession(pb_core.SessionRequest(
        user_agent='text_client %s' % __version__,
        version=version,
    ))
    context = reply.context
    print "Started session %r, status %s" % (context.session_id,
                                             reply.response_info.status.code)

    reply_stream = stub.CreatePipelines(pb_core.PipelineCreateRequest(
        context=context,
        train_features=[
            pb_core.Feature(feature_id='feature1',
                           data_uri='file:///data/feature1.csv'),
            pb_core.Feature(feature_id='feature2',
                           data_uri='file:///data/feature2.csv'),
        ],
        task=pb_core.CLASSIFICATION,
        task_subtype=pb_core.NONE,
        task_description="Debugging task",
        output=pb_core.FILE,
        metrics=[
            pb_core.ACCURACY,
            pb_core.ROC_AUC,
        ],
        target_features=[
            pb_core.Feature(feature_id='targetfeature',
                           data_uri='file:///data/targetfeature.csv'),
        ],
        max_pipelines=10,
    ))
    print("Requested pipelines")
    pipelines = set()
    for result in reply_stream:
        if result.response_info.status.code == pb_core.CANCELLED:
            print "Pipelines creation cancelled"
            break
        elif result.response_info.status.code != pb_core.OK:
            print "Error during pipelines creation"
            if result.response_info.status.details:
                print "details: %r" % result.response_info.status.details
            break
        progress = result.progress_info
        pipeline_id = result.pipeline_id
        pipeline = result.pipeline_info
        if not result.HasField('pipeline_info'):
            pipeline = None

        print "%s %s %s" % (progress, pipeline_id, pipeline)
        if progress == pb_core.COMPLETED:
            pipelines.add(pipeline_id)

    for pipeline_id in pipelines:
        print "Executing pipeline %s" % pipeline_id
        reply_stream = stub.ExecutePipeline(pb_core.PipelineExecuteRequest(
            context=context,
            pipeline_id=pipeline_id,
        ))
        for result in reply_stream:
            if result.response_info.status.code == pb_core.CANCELLED:
                print "Pipeline execution cancelled"
                break
            elif result.response_info.status.code != pb_core.OK:
                print "Error during pipeline execution"
                if result.response_info.status.details:
                    print "details: %r" % result.response_info.status.details
                break
            progress = result.progress_info
            assert result.pipeline_id == pipeline_id
            print "%s %s" % (progress, pipeline_id)
            if progress == pb_core.COMPLETED:
                print "Pipeline execution completed"

    reply = stub.EndSession(context)
    print "Ended session %r, status %s" % (context.session_id,
                                           reply.status.code)
