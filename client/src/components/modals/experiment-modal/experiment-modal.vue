<template>
<base-modal ref="modal" :title="titles[currentStep]"
  :visible-state="experimentModalVisible"
  :on-open="openExperimentModal"
  :on-close="closeExperimentModal"
  :on-enter="next"
  size="lg"
  >
<template slot="content">
<b-container fluid>
<div v-if="currentStep === 'consentForm'">
<p>
You have been invited to take part in a research study to learn more about using dataflow for visual data exploration.
This study will be conducted by Bowen Yu, Computer Science and Engineering (CSE), Tandon School of Engineering, New York University, as a part of his Doctoral Dissertation.
His faculty sponsor is Professor Claudio Silva, Department of Computer Science and Engineering (CSE), Tandon School of Engineering, New York University.
If you agree to be in this study, you will be asked to do the following:
</p>
<ul>
  <li>Learn how to use the VisFlow framework to visually explore data.</li>
  <li>Learn how to use the FlowSense natural language interface to construct dataflow diagrams in VisFlow.</li>
  <li>Perform assigned data analysis tasks using the VisFlow system.</li>
</ul>
<p>
The following actions you perform on the systems will be recorded for analysis:
</p>
<ul>
  <li>Interaction with the system via mouse and keyboard input.</li>
  <li>Text produced from voice input (no audio data will be collected).</li>
</ul>
<p>
Participation in this study will involve 15 minutes of tutorial,
15 minutes of practice, and 30-60 minutes of data analysis tasks.
There are no known risks associated with your participation in this research beyond those of everyday life.
</p>
<p>
Although you will receive no direct benefits, this research may help the investigator understand using dataflow for visual data exploration.
Confidentiality of your research records will be strictly maintained by assigning code numbers to each participant so that data is never linked to individual identity.
Your information from this study will not be used for future research.
</p>
<p>
Participation in this study is voluntary.
You may refuse to participate or withdraw at any time without penalty.
For interviews, questionnaires, or surveys, you have the right to skip or not answer any questions you prefer not to answer.
</p>
<p>
If there is anything about the study or your participation that is unclear or that you do not understand, if you have questions or wish to report a research-related problem, you may contact Bowen Yu, bowen.yu@nyu.edu, 2 MetroTech center, 10th floor, New York, 11201, or the faculty sponsor, Claudio Silva at (646) 997-4093, csilva@nyu.edu, 2 MetroTech Center, 10th Floor, New York, 11201.
For questions about your rights as a research participant, you may contact the University Committee on Activities Involving Human Subjects (UCAIHS), New York University, 665 Broadway, Suite 804, New York, 10012, at ask.humansubjects@nyu.edu or (212) 998-4808. Please reference the study # (IRB-FY2018-2102) when contacting the IRB (UCAIHS).
</p>
<p>
By clicking the "Agree and Start" button below, you acknowledge that you have read and understood the information above and agree to proceed with the study.
</p>
</div>

<div v-if="currentStep === 'overview'">
<p>
In this user study, you will learn how to use VisFlow, the dataflow framework for visual data exploration,
along with its natural language interface FlowSense.
</p>

<p>
Please take a second to save the following link for your session.
You may pause/exit the user study by closing the browser tab.
You may go to the link below to resume your user study session.
</p>
<p>
<b>Your session link:  </b>
<a :href="sessionLink">{{sessionLink}}</a>
</p>

<p>
The structure of this study will be as follows:
</p>
<ul>
  <li>VisFlow Tutorial (5-10 minutes)</li>
  <li>FlowSense Tutorial (5-10 minutes)</li>
  <li>Practice with the system (10-15 minutes)</li>
  <li>Experiment Task (30-60 minutes)</li>
</ul>
<p>
If you have questions at any time of the user study, please reach out to our user study assistant.
</p>
</div>

<div v-if="currentStep === 'visflowTutorial'">
  We will now introduce the basic usage of the VisFlow dataflow framework.
  <div>
    Please go through the steps in the <a href="#">Getting Started</a> page.
  </div>
</div>

<div v-if="currentStep === 'flowsenseTutorial'">
  Now you will learn how to use FlowSense, the natural langugage interface of VisFlow.
  <div>
    Please read the <a href="#">FlowSense instructions</a>.
  </div>
</div>

<div v-if="currentStep === 'practice'">
  Please take a few minutes to practice VisFlow and FlowSense.
  You may use the demo datasets we have prepared for the practice.
  Once you are comfortable with all the introduced operations,
  come back here and click "Continue".
</div>

<div v-if="currentStep === 'task'">
  <div>
  You are now familiar with VisFlow and FlowSense.
  Let's apply what we have learned to solve some data analysis problem.
  In this experiment, you will analyze a <a href="#">Test Result Dataset</a> that includes the coding test results of software engineer candidates
  along with the background information about the candidates.
  You will use VisFlow and FlowSense to explore the dataset, and answer a few questions.
  Edit the diagram to answer each question.
  After you are done, come back here and click "Continue" to move on to the next question.
  You will use a same diagram throughout all questions.
  </div>
  <div>
    Please note that the time you take to complete the tasks will be recorded and used to analyze the effectiveness of the system.
    Please complete the tasks in one sitting to avoid imprecise measurement of task completion time.
  </div>
</div>

<div v-if="currentStep === 'task1'">
  First, create a visualization that shows the distribution of programming languages used by the candidates.
</div>

<div v-if="currentStep === 'task2'">
  Present the data to show which test question (in question ID) was the hardest among C++ candidates.
</div>

<div v-if="currentStep === 'task3'">
  Identify which set of the questions are most effective to separate the most experienced candidates from the less experienced candidates.
</div>

<div v-if="currentStep === 'end'">
  Thank you for participating in the VisFlow / FlowSense user study.
  You have successfully completed the study.
  You may now close the browser window.
</div>

</b-container>
</template>
<template slot="footer">
  <b-btn class="float-right" variant="primary" @click="next">
    <span v-if="currentStep === 'consentForm'">Agree and Start</span>
    <span v-else-if="currentStep === 'end'">Finish</span>
    <span v-else>Continue</span>
  </b-btn>
  <template v-if="currentStep !== 'end'">
    <b-btn class="float-right" variant="outline-secondary" @click="close">Close</b-btn>
    <b-btn v-if="currentStep !== 'consentForm'" class="float-right" variant="outline-secondary" @click="previous">Previous</b-btn>
  </template>
  </template>
</base-modal>
</template>

<script lang="ts" src="./experiment-modal.ts">
</script>
