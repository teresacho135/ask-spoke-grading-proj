const fetch = require('node-fetch');
const {answers} = require('./quiz.json')


function inputToken() {
  return new Promise((resolve, reject) => {
    try {
      fetch('https://opentdb.com/api_token.php?command=request')
      .then(response => response.json())
      .then(data => {
      const {token} = data;
      if (token) {
        return resolve (token);
      };
    });
    } catch (err) {
    reject (console.log('Error: Did not obtain token'));
    }
  })
  .catch(error=> Error(error));
  };

function categoryCalls(categoryNum) {
  return new Promise(async (resolve, reject) => {
    try{
    const categoryResults = await fetch(`https://opentdb.com/api_count.php?category=${categoryNum}`)
    .then(res => res.json());
    let totalQuestions = categoryResults.category_question_count.total_question_count;
    let initalCall = Math.floor(totalQuestions/50);
    let remainingCall = totalQuestions % 50;
    resolve(
      [initalCall, remainingCall]
    )
    } catch (err) {
      reject (console.log('err :', err));
    };
  })
  .catch(error => Error(error));
}

function getQuestions(token, totalCalls, remaining) {
  return new Promise(async (resolve, reject) => {
    const quizMasterSheet = answers.reduce((masterSheet, quizElement) => {
      masterSheet[quizElement.question] = {student_answer: quizElement.answer}
      return masterSheet
    }, {})
    try{
      for (let i = (totalCalls + 1); i; i--){
        const {results} = await fetch(`https://opentdb.com/api.php?amount=${(i > 1) ? 50 : remaining}&category=11&token=${token}`).then(res=>res.json())
        results.forEach(currentQuestion => {
          if(quizMasterSheet[currentQuestion.question])
          quizMasterSheet[currentQuestion.question] = {
            ...quizMasterSheet[currentQuestion.question], 
            ...currentQuestion
          };
        });
      };
      resolve(quizMasterSheet);
    }
    catch {
      reject('error');
    };
  })
    .catch(error => Error(error))
};

function rubric({question}, questionCalls) {
  const gradeables = questionCalls[question];
  if(gradeables.student_answer !== gradeables.correct_answer)
    return 0
  const baseScore = {boolean: 2, multiple: 5};
  const difficultyMultiplier = {easy: 1, medium: 2, hard: 3};
  return baseScore[gradeables.type] * difficultyMultiplier[gradeables.difficulty];
};

function evaluateGrade(answers, categoryNumber) { 
  return new Promise(async (resolve, reject) => { 
    try {
      const tokenObtained = await inputToken('token');
      const [numOfCallsAtMax, remainder] = await categoryCalls(categoryNumber || categorySearch);
      const questionCalls = await getQuestions(tokenObtained, numOfCallsAtMax, remainder);
      const totalScore =  answers.reduce((scoreBoard, currentQuestion) => (
        scoreBoard + rubric(currentQuestion, questionCalls)
      ), 0);
        resolve(totalScore);
      }
    catch (error) {
      reject (console.log(error));
    };
  })
  .catch(error => Error(error));
};

evaluateGrade(answers, 11)
  .then(res =>
    console.log('Your Total Score is: ', res));