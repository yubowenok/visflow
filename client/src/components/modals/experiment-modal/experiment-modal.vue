<template>
<base-modal ref="modal" :title="titles[currentStep]"
  :visible-state="experimentModalVisible"
  :on-open="openExperimentModal"
  :on-close="closeExperimentModal"
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
Participation in this study will involve 20 minutes of tutorial,
10 minutes of practice, and 30-45 minutes of data analysis tasks.
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
  <li>VisFlow Tutorial (15-20 minutes)</li>
  <li>FlowSense Tutorial (15-20 minutes)</li>
  <li>Practice with the system (10 minutes)</li>
  <li>Experiment Task (30-45 minutes)</li>
</ul>
<p>
If you have questions at any time of the user study, please reach out to our user study assistant.
</p>
</div>

<div v-if="currentStep === 'visflowTutorial'">
<p>Let's first take a look at the basic usage of the VisFlow dataflow framework.</p>
Please follow the steps in the <a href="https://visflow.org/get-started/" target="_blank">Getting Started</a> page.
Reproduce the tutorial diagram that:
<ul>
  <li>Visualizes <i>car.csv</i> in a scatterplot.</li>
  <li>Shows the selected cars from the scatterplot in a table.</li>
  <li>Shows a histogram of the mpg value distribution.</li>
  <li>Highlights the selected cars from the scatterplot in the histogram.</li>
  <li>Uses an attribute filter to show only cars with an mpg between 10 and 15 in the histogram.</li>
</ul>

<p>
  Later you may need to work with two tables of different formats.
  Please take a look at <a href="https://visflow.org/dataflow/linking.html" target="_blank">table linking</a> if you haven't.
</p>

<p>
You may close this user study dialog to return to diagram editing.
To come back to this dialog, click the <i>User Study</i> button at the top-right corner of the system.
After your are done, proceed to the next step by clicking <i>Continue</i>.
</p>
</div>

<div v-if="currentStep === 'flowsenseTutorial'">
Next, let's learn how to use FlowSense, the natural langugage interface of VisFlow.
<div>
  Please read the <a href="https://visflow.org/flowsense" target="_blank">FlowSense instructions</a>.
  In particular, checkout the <a href="https://visflow.org/flowsense/#examples" target="_blank">example queries</a> to see what FlowSense is capable of.
  After walking through the instructions, see if you can do everything described in <a href="https://visflow.org/get-started/" target="_blank">Getting Started</a> using FlowSense.
  To confirm your understanding of FlowSense, please use the natural language interface to:
</div>
<ul>
  <li>Load <i>car.csv</i>.</li>
  <li>Draw a scatterplot of mpg and displacement.</li>
  <li>Show the selected cars from the scatterplot in a table.</li>
  <li>Highlight the selected cars from the scatterplot in a histogram.</li>
  <li>Find which cars have an mpg between 10 and 15 from the selected bars of the histogram.</li>
</ul>
After completing the above, proceed to the next step.
If you want to revisit the usage of VisFlow, you may go to the previous steps by clicking <i>Previous</i>.
</div>

<div v-if="currentStep === 'practice'">
Please take a few minutes to practice VisFlow and FlowSense and explore their features.
You may freely explore the three demo datasets we have prepared:
<ul>
  <li><i>car.csv</i></li>
  <li><i>iris.csv</i></li>
  <li><i>gdp.csv (time series)</i></li>
</ul>
<p>
  Please do <i>NOT</i> use the other two datasets <i>sde_test_results.csv</i> and <i>sde_test_users.csv</i>, which will be saved for the tasks that follow.
  Once you feel comfortable with the usage of VisFlow and FlowSense, proceed to the next step.
</p>
</div>

<div v-if="currentStep === 'task'">
<p>
You are now familiar with VisFlow and FlowSense.
Let's apply what we have learned to solve some data analysis problems.
</p>
<p>
In this experiment, you will analyze the <b>SDE Test Dataset</b>.
The dataset includes the test results of software engineer candidates, which reflect how strong the computer science background of each candidate is.
There are two tables:
</p>

<ul>
  <li><b>sde_test_results.csv</b>
  This table includes the test results for each candidate.
  A test consists of answering several multi-choice questions selected by the system from a large question pool.
  Each question has a unique ID, a preset difficulty, its supported programming language(s), and possibly a time limit.
  If the candidate answers a question, a result ("correct" or "wrong") is given.
  Getting a question wrong results in a negative score penalty.
  So a candidate may choose to "skip" a question and get zero score.
  If a candidate has no action during the time limit of a question, the result is "unanswered".
  The "TimeTaken" column stores how much time in seconds a candidate took to answer a question.
  </li>
  <li><b>sde_test_users.csv</b>
  This table includes background information about each candidate, such as the candidate's age, field of study, and graduation date.
  </li>
</ul>

<p></p>
<p>
You will use VisFlow and FlowSense to explore the SDE Test dataset, and answer a few questions.
<b>You are encouraged to use FlowSense as much as possible</b>.
Questions will be shown sequentially.
For each question, create and edit a dataflow diagram to show a visualization that may answer the question.
Also enter the answer in the text box below the question, and provide a brief explanation of your findings.
</p>

<p>
After answering each question, come back to this dialog to move on to the next question.
You may use a same diagram throughout all questions.
</p>

<p>
Please note that the time you take to complete the tasks will be recorded and used to analyze the effectiveness of the system.
Please complete the tasks in one sitting to avoid imprecise measurement of task completion time.
</p>
</div>

<div v-if="currentStep === 'task1'">
  <p>
    Create a visualization that shows the distribution of the results for all the questions asked.
    A same question may be asked multiple times, in which case each occurrence of that question is counted separately.
  </p>
  <p>
    How many questions were skipped in total?
    What is the percentage of a question being answered correctly?
  </p>
<div class="section">Enter your answer here:</div>
<div class="section">
  <b-form-textarea v-model="task1Answer" placeholder="Your answer here"></b-form-textarea>
</div>
</div>

<div v-if="currentStep === 'task2'">
  <p>
    There is an outlier within the user information table regarding the user's age.
    What is the user ID of that outlier?
  </p>
  <p>
    The "TimeTaken" column of the results table is supposed to record how many seconds a candidate took to answer a question.
    However, there was some data recording discrepancy.
    Could you visualize the discrepancy, and explain what do you suspect to have happened that resulted in this discrepancy?
  </p>
<div class="section">Write down the outlier user ID, and explain your findings about the "TimeTaken" discrepancy:</div>
<div class="section">
  <b-form-textarea v-model="task2Answer" placeholder="Your answer here"></b-form-textarea>
</div>
</div>

<div v-if="currentStep === 'task3'">
  <p>
    Find one question with a question ID greater than 400 which candidates with a Masters degree can answer
    significantly better than candidates with a Bachelors degree.
  </p>
  <p>
    The question should have enough occurrences (at least 10) given to both Masters and Bachelors candidates.
    Masters that answered this question should achieve a much higher correct rate than Bachelors who answered this question.
  </p>

<div class="section">Write down the question ID, and briefly explain how you draw the conclusion from the dataflow diagram:</div>
<div class="section">
  <b-form-textarea v-model="task3Answer" placeholder="Your answer here"></b-form-textarea>
</div>
</div>

<div v-if="currentStep === 'survey'">
<p>Thank you for completing all the tasks.</p>
<p>
  As a last step, please take this survey to give us your feedback about the system:
  <a :href="surveyLink" target="_blank" class="bold" @click="surveyLinkClicked = true">SURVEY LINK</a>
</p>
</div>

<div v-if="currentStep === 'end'">
  Thank you for participating in the VisFlow / FlowSense user study.
  You have successfully completed the study.
  You may now close the browser window.
</div>

<div v-if="currentStep === 'finish'">
  This user study has been completed.
</div>

<div v-if="currentStep.match(/^clear/)">
To proceed to the next step, the diagram will be cleared. Would you like to proceed?
</div>

</b-container>
</template>
<template slot="footer">
  <b-btn class="float-right" variant="primary" @click="next" :disabled="isNextDisabled">
    <span v-if="currentStep === 'consentForm'">Agree and Start</span>
    <span v-else-if="currentStep === 'end' || currentStep === 'finish'">Finish</span>
    <span v-else>Continue</span>
  </b-btn>
  <template v-if="currentStep !== 'end' && currentStep !== 'finish'">
    <b-btn class="float-right" variant="outline-secondary" @click="close">Close</b-btn>
    <b-btn v-if="currentStep !== 'consentForm'" class="float-right" variant="outline-secondary" @click="previous">Previous</b-btn>
  </template>
  </template>
</base-modal>
</template>

<script lang="ts" src="./experiment-modal.ts">
</script>
