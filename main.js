"use strict";
const screenWidth =
  window.innerWidth ||
  document.documentElement.clientWidth ||
  document.body.clientWidth;

//TEMPLATES
const newTaskTemplate = document.getElementById("new-task-template");
const taskCardTemplate = document.getElementById("task-card-template");
const subtaskListTemplate = document.getElementById("subtask-list-template");
const addSubtaskTemplate = document.getElementById("add-subtask-template");
const asideTag = document.getElementById("aside");
//DISPLAY CONTAINERS
const modalLargeContainer = document.getElementById("modal-large");
const mainPageContainer = document.getElementById("js-main-page-container");
const completedTasksContainer = document.getElementById("completed-tasks");
const currentTasksContainer = document.getElementById("current-tasks");
const urgentTasksContainer = document.getElementById("urgent-tasks");
const longTermTasksContainer = document.getElementById("long-term-tasks");
const modalLargeHeader = document.querySelector("[data-task-panel-header]");
const mobileNavContainer = document.getElementById("mobile-nav");

//NEW TASK PART INPUTS AND CONTAINERS
let newTaskPanel,
  newTaskNameInput,
  newTaskStartInput,
  newTaskDeadlineInput,
  newTaskDescriptionInput,
  newTaskSubtaskContainer;

//LOCAL STORAGE
const LOCAL_STORAGE_TASK_LIST_KEY = "task.list";
const LOCAL_STORAGE_SELECTED_TASK_LIST_ID = "task.selectedTaskId";
let tasks = JSON.parse(localStorage.getItem(LOCAL_STORAGE_TASK_LIST_KEY)) || [];
let selectedTaskId = JSON.parse(
  localStorage.getItem(LOCAL_STORAGE_SELECTED_TASK_LIST_ID)
);

const isMobile = screenWidth < 768;
const setIcon = (element, iconText) => (element.textContent = iconText);

const checkScreenWidth = () => {
  const taskCardLists = mainPageContainer.querySelectorAll(".task-card-li");
  isMobile
    ? taskCardsSetOpenModalByView(taskCardLists)
    : taskCardsRemoveOpenModalByView(taskCardLists);
};

function taskCardsSetOpenModalByView(cardLists) {
  cardLists.forEach((cardList) => {
    cardList.firstElementChild.setAttribute("data-open-modal-lg", "task-card");
    cardList.firstElementChild.classList.remove("toggle");
  });
}

function taskCardsRemoveOpenModalByView(cardLists) {
  cardLists.forEach((cardList) => {
    cardList.firstElementChild.removeAttribute("data-open-modal-lg");
    cardList.firstElementChild.classList.add("toggle");
  });
}

function taskCardToggle(taskId) {
  if (taskId === undefined) return;
  const taskCardLi = document.querySelector(`[data-task-id="${taskId}"]`);
  const taskCardDetailed = taskCardLi.querySelector(".toggle-content");
  toggleHideShow(taskCardDetailed);
}

//FORM VALIDATION
function setNewTaskInputEvents() {
  const today = new Date().toISOString().substr(0, 10);
  newTaskPanel.addEventListener("click", newTaskButtonActions, false);
  newTaskNameInput.addEventListener("input", validateTaskName, false);
  newTaskDescriptionInput.addEventListener(
    "change",
    validateDescription,
    false
  );
  newTaskStartInput.value = today;
  newTaskStartInput.addEventListener("change", validateTaskStart, false);
  newTaskDeadlineInput.value = today;
  newTaskDeadlineInput.addEventListener("change", validateTaskDeadline, false);
}

function newTaskButtonActions(e) {
  const buttonType = e.target.dataset.newTaskButton;
  if (!buttonType) return;
  buttonType === "create-button" ? getData() : resetForm();
}

const validateTaskName = function (e) {
  let element = e.currentTarget;
  let message;
  let state;
  if (newTaskNameInput.value.trim().length < 6) {
    message = "* Can not be less than 6 characters";
    state = "error";
  } else {
    displayTimeOutValidationStates(element);
    message = " Looks fine!";
    state = "valid";
  }
  displayValidationStates(element, message, state);
};

const validateDescription = function () {
  if (newTaskDescriptionInput.value.trim().length > 0) {
    console.log("Good to go! ");
  } else {
    console.log("This is empty so act like that ");
  }
};

const validateTaskDate = function () {
  const today = new Date().toISOString().substr(0, 10);
  let startDate = Date.parse(newTaskStartInput.value);
  let currentDate = Date.parse(today);
  let finishDate = Date.parse(newTaskDeadlineInput.value);
  if (startDate > finishDate) {
    return "Generic Error";
  } else if (currentDate > finishDate) {
    return "Spesific Error";
  } else {
    return "Good to go";
  }
};

const validateTaskStart = function () {
  let element = newTaskStartInput;
  let message;
  let state;
  if (validateTaskDate() == "Generic Error") {
    message = "* Start date cannot be later than Deadline";
    state = "error";
  } else {
    displayTimeOutValidationStates(element);
    message = " Looks fine!";
    state = "valid";
  }
  displayValidationStates(element, message, state);
};

const validateTaskDeadline = function (e) {
  validateTaskStart();
  let element = e.currentTarget;
  let message;
  let state;
  if (validateTaskDate() == "Generic Error") {
    message = "* Deadline cannot be earlier than Start Date";
    state = "error";
  } else if (validateTaskDate() == "Spesific Error") {
    message = "* Deadline cannot be earlier from Today";
    state = "error";
  } else {
    displayTimeOutValidationStates(element);
    message = " Looks fine!";
    state = "valid";
  }
  displayValidationStates(element, message, state);
};

const validateSubtask = function () {
  console.log("Hi from Subtasks");
  let selectAllSubtaskForms = document.querySelectorAll(".new-subtask");
  let formCount = selectAllSubtaskForms.length;
  let subtaskFormsArray = Array.from(selectAllSubtaskForms);
  let notEmptyCount = subtaskFormsArray.filter(
    (e) => e.value.trim().length > 0
  );
  if (formCount == notEmptyCount.length) {
    renderNewTaskAddSubtask();
    setFocus();
  }
};

function displayValidationStates(element, message, state) {
  element.dataset.validationInput = state;
  element.nextElementSibling.textContent = message;
  element.nextElementSibling.dataset.validationMessage = state;
  element.previousElementSibling.dataset.validationLabel = state;
}

const setValidationStatesToDefault = (element) => {
  displayValidationStates(element, null, "none");
};

const displayTimeOutValidationStates = (el) => {
  setTimeout(() => setValidationStatesToDefault(el), 3000);
};

//MODAL PART

const changeDisplayState = (function () {
  function getShowValues(isModalOrOverlay) {
    return { overlay: "show", modal: "opened" }[isModalOrOverlay];
  }

  function getHideValues(isModalOrOverlay) {
    return { overlay: "hide", modal: "closed" }[isModalOrOverlay];
  }

  function checkElementType(name) {
    const strName = name;
    return [...strName.split("-")][0];
  }

  function show(...items) {
    const names = [...items];
    for (name of names) {
      const isModalOrOverlay = checkElementType(name);
      const valueForShow = getShowValues(isModalOrOverlay);
      applyDisplayState(name, valueForShow);
    }
  }
  function hide(...items) {
    const names = [...items];
    for (name of names) {
      const isModalOrOverlay = checkElementType(name);
      const valueForHide = getHideValues(isModalOrOverlay);
      applyDisplayState(name, valueForHide);
    }
  }

  function applyDisplayState(name, value) {
    asideTag
      .querySelector(`[data-${name}]`)
      .setAttribute(`data-${name}`, `${value}`);
  }
  return {
    show: show,
    hide: hide,
  };
})();

const initModals = (ev) => {
  document.addEventListener("click", modalLargeEvents, false);
  asideTag.addEventListener("click", mobileRelocateTaskCard.init, false);
};

// USES MODAL MEDIUM
const mobileRelocateTaskCard = (function () {
  const CONTAINER_NAMES_ARRAY = [
    "completed-tasks",
    "current-tasks",
    "urgent-tasks",
    "long-term-tasks",
  ];

  const isBelongContainersArray = function (clickedValue) {
    const values = CONTAINER_NAMES_ARRAY;
    return values.includes(clickedValue);
  };

  const shouldOpenContainerListMenu = function (e) {
    const containerValue = e.target.dataset.taskPanelTextContainer;
    return isBelongContainersArray(containerValue);
  };

  const shouldCloseContainerListMenu = function (e) {
    return e.target.dataset.closeModalMd === "";
  };

  const sortContainerList = function (e) {
    const containerArray = CONTAINER_NAMES_ARRAY;
    const currentContainer = e.target.dataset.taskPanelTextContainer;
    const sortedContainerArray = [
      currentContainer,
      ...containerArray.filter((item) => item !== currentContainer),
    ];
    return sortedContainerArray;
  };

  function populateListAndButtons(e) {
    const ulElement = asideTag.querySelector("[data-select-list]");
    const containerNamesArray = sortContainerList(e);
    clearElement(ulElement);
    containerNamesArray.forEach((item) => {
      const liElement = document.createElement("li");
      const buttonElement = document.createElement("button");
      const textToPrint = item.replace(/-/g, " ");
      buttonElement.textContent = textToPrint;
      buttonElement.dataset.selectListItem = item;
      liElement.appendChild(buttonElement);
      ulElement.appendChild(liElement);
    });
    disableFirstButton();
  }

  function disableFirstButton() {
    const buttonElements = asideTag.querySelectorAll("[data-select-list-item]");
    buttonElements[0].disabled = true;
  }

  function addClickListener(e) {
    asideTag
      .querySelector("[data-modal-md]")
      .addEventListener("click", sendTaskToNewContainer, false);
  }

  function renderContainerList(e) {
    openModalMedium();
    addClickListener();
    populateListAndButtons(e);
  }

  function sendTaskToNewContainer(e) {
    const newContainerName = e.target.dataset.selectListItem;
    closeModalMedium();
    showMessageBoxToAsk.toRelocate(selectedTaskId, newContainerName);
  }

  function openModalMedium() {
    changeDisplayState.show("overlay-md", "modal-md");
  }

  function closeModalMedium() {
    changeDisplayState.hide("overlay-md", "modal-md");
  }

  function modalMediumEvents(e) {
    if (shouldOpenContainerListMenu(e)) renderContainerList(e);
    if (shouldCloseContainerListMenu(e)) closeModalMedium();
  }

  return {
    init: modalMediumEvents,
  };
})();
// USES MODAL SMALL
const showMessageBoxToAsk = (function () {
  const messageContent = function (message) {
    return {
      "long-term": {
        h: "send this task to Long-Term tasks?",
        p: "* To do this, you need to change the deadline",
      },
      urgent: {
        h: "send this task to Urgent tasks?",
        p: "* To do this, you need to change the deadline",
      },
      current: { h: "send this task to Current tasks?", p: "" },
      completed: {
        h: "complete this task?",
        p: "* The task will be completed.",
      },
      delete: { h: "delete this task?", p: "* You cannot undo this action." },
    }[message];
  };
  const contentContainer = asideTag.querySelector("[data-message-box-content]");
  const messageBoxContainer = contentContainer.parentElement;
  const title = document.createElement("h5");
  const paragraph = document.createElement("p");
  const input = document.createElement("input");
  const confirmButton = asideTag.querySelectorAll(`[data-message-button]`)[1];

  function createTitle(str) {
    title.setAttribute("data-message-box-title", "");
    title.textContent = `Do you want to  ${str} `;
    contentContainer.appendChild(title);
  }

  function createParagraph(str) {
    paragraph.setAttribute("data-message-box-notes", "show");
    paragraph.textContent = str;
    contentContainer.appendChild(paragraph);
  }

  function createInput() {
    input.setAttribute("type", "date");
    input.setAttribute("data-update-deadline-input", "");
    input.setAttribute("data-validation-input", "none");
    input.value = new Date().toISOString().substr(0, 10);
    input.classList.add("add-task-deadline");
    input.addEventListener("change", validateInput, false);
    contentContainer.insertBefore(input, paragraph);
  }

  const addEvent = (eventName) => {
    messageBoxContainer.addEventListener("click", eventName, false);
  };

  const removeEvent = (eventName) => {
    messageBoxContainer.removeEventListener("click", eventName, false);
  };

  const closeMessageBox = (evToRemove) => {
    changeDisplayState.hide("overlay-sm", "modal-sm");
    removeEvent(evToRemove);
    clearElement(contentContainer);
    renderAndReOpen();
  };

  const openMessageBox = () => {
    changeDisplayState.show("overlay-sm", "modal-sm");
  };

  const isCancelMessageButton = function (e) {
    return e.target.dataset.messageButton === "cancel";
  };

  const isConfirmMessageButton = function (e) {
    return e.target.dataset.messageButton === "confirm";
  };

  function disableConfirmButton(state) {
    const stateStr = state === true ? "disabled" : "confirm";
    confirmButton.disabled = state;
    confirmButton.dataset.messageButton = stateStr;
  }

  const valuesOfSendTaskTo = function () {
    let _newContainer;
    let _currentTaskId;
    return {
      get container() {
        return _newContainer;
      },
      get taskId() {
        return _currentTaskId;
      },
      set container(_newContainerName) {
        _newContainer = _newContainerName;
      },
      set taskId(_selectedTaskId) {
        _currentTaskId = _selectedTaskId;
      },
    };
  };

  const getNewStatus = function () {
    const containerName = valuesOfSendTaskTo.container;
    const containerStr = containerName;
    const newStatus = containerStr.replace("-tasks", "");
    return newStatus;
  };

  const getTaskvalues = function () {
    const taskCardId = valuesOfSendTaskTo.taskId;
    const containerName = valuesOfSendTaskTo.container;
    const selectedTask = tasks.find((task) => task.id === taskCardId);
    const currentDeadline = selectedTask.deadline;
    return { selectedTask, containerName, currentDeadline };
  };

  const isStatusMatchesWithDateRange = function (status, dateRange) {
    return {
      "long-term": { true: "confirm", false: "reject" },
      urgent: { true: "reject", false: "confirm" },
    }[status][dateRange];
  };

  const validationContent = function (status, dateResult) {
    return {
      "long-term": {
        confirm: { message: "Looks Fine !", attr: "valid" },
        reject: {
          message: "Deadline cannot be earlier than 7 days.",
          attr: "error",
        },
      },
      urgent: {
        confirm: { message: "Looks Fine !", attr: "valid" },
        reject: {
          message: "Deadline cannot be later than 7 days.",
          attr: "error",
        },
      },
    }[status][dateResult];
  };

  function validateInput(e) {
    const inputBox = e.currentTarget;
    const messageText = e.currentTarget.nextElementSibling;
    const dateRange = checkTaskStatusRange(e.currentTarget.value);
    const status = getNewStatus();
    const validationStateValue = isStatusMatchesWithDateRange(
      status,
      dateRange
    );
    const validationObj = validationContent(status, validationStateValue);
    const { message, attr } = validationObj;
    messageText.textContent = message;
    messageText.dataset.messageBoxNotes = attr;
    inputBox.dataset.validationInput = attr;
    const buttonState = attr === "valid" ? false : true;
    disableConfirmButton(buttonState);
  }

  const isInputNeeded = function (newStatus) {
    if (!isLongTermOrUrgent(newStatus)) return false;
    const taskValues = getTaskvalues();
    const { currentDeadline } = taskValues;
    const dateRange = checkTaskStatusRange(currentDeadline);
    const result = isStatusMatchesWithDateRange(newStatus, dateRange);
    return result === "reject";
  };

  const isLongTermOrUrgent = function (status) {
    return status === "long-term" || status == "urgent";
  };

  function determineStatusMessageContent() {
    const status = getNewStatus();
    createTitle({ ...messageContent(status) }.h);

    isMessageBoxNeeded(status) &&
      createParagraph({ ...messageContent(status) }.p);

    isInputNeeded(status) && createInput() && disableConfirmButton(true);

    addEvent(statusEvents);
  }

  function statusEvents(e) {
    if (isConfirmMessageButton(e)) confirmStatusChange();
    if (isCancelMessageButton(e)) closeMessageBox(statusEvents);
  }

  function confirmStatusChange() {
    const taskValues = getTaskvalues();
    const { selectedTask, containerName, currentDeadline } = taskValues;
    const status = getNewStatus();
    const newDeadline = isInputNeeded(status) ? input.value : currentDeadline;
    updateTaskStatus({ selectedTask, newStatus: status, newDeadline });
    setModalLargeHeader(containerName);
    closeMessageBox(statusEvents);
  }

  function proceedWithMessageBox() {
    openMessageBox();
    determineStatusMessageContent();
  }

  function proceedWithoutMessageBox() {
    confirmStatusChange();
  }

  const isMessageBoxNeeded = function (status) {
    return status === "completed" ? true : isInputNeeded(status);
  };

  function notOnMobile() {
    const status = getNewStatus();
    isMessageBoxNeeded(status)
      ? proceedWithMessageBox()
      : proceedWithoutMessageBox();
  }

  function shouldOpenMessageBox() {
    isMobile ? proceedWithMessageBox() : notOnMobile();
  }

  function prepareToStatusChange(id, newContainerName) {
    valuesOfSendTaskTo.container = newContainerName;
    valuesOfSendTaskTo.taskId = id;
    shouldOpenMessageBox();
  }

  function createTitleAndParagraph(contentName) {
    createTitle({ ...messageContent(contentName) }.h);
    createParagraph({ ...messageContent(contentName) }.p);
  }

  function renderToCompleteContent() {
    openMessageBox();
    createTitleAndParagraph("completed");
    addEvent(completeEvents);
  }

  function completeEvents(e) {
    if (isConfirmMessageButton(e)) confirmCompleteTask();
    if (isCancelMessageButton(e)) closeMessageBox(completeEvents);
  }

  function confirmCompleteTask() {
    completeTask();
    closeMessageBox(completeEvents);
  }

  function renderToDeleteContent() {
    openMessageBox();
    createTitleAndParagraph("delete");
    addEvent(deleteEvents);
  }

  function deleteEvents(e) {
    if (isConfirmMessageButton(e)) confirmDeleteTask();
    if (isCancelMessageButton(e)) closeMessageBox(deleteEvents);
  }

  function confirmDeleteTask() {
    deleteTask();
    closeMessageBox(deleteEvents);
  }

  return {
    toRelocate: prepareToStatusChange,
    toComplete: renderToCompleteContent,
    toDelete: renderToDeleteContent,
  };
})();

//MODAL LARGE PART
function isAboutModalLarge(e) {
  return e.target.dataset.openModalLg || e.target.dataset.closeModalLg === "";
}

function isOpenModalLarge(e) {
  return e.target.dataset.openModalLg;
}

function modalLargeEvents(e) {
  if (!isAboutModalLarge(e)) return;
  if (isOpenModalLarge(e)) setOpenModalLargeContent(e);
  else setCloseModalLargeEvents();
}

function setCloseModalLargeEvents() {
  resetTaskOnModal();
  renderAndReOpen();
  changeDisplayState.hide("overlay-lg", "modal-lg");
}

function isNewTask(e) {
  return e.target.dataset.openModalLg === "new-task";
}

function setOpenModalLargeContent(e) {
  if (isNewTask(e)) renderNewTaskOnModal(e);
  else renderTaskCardOnModal(e);
}

function renderNewTaskOnModal(e) {
  clearElement(modalLargeContainer);
  const newTask = document.importNode(newTaskTemplate.content, true);
  newTaskPanel = newTask.getElementById("js-new-task-container");
  newTaskNameInput = newTask.querySelector("[data-new-task-name-input]");
  newTaskStartInput = newTask.querySelector("[data-new-task-start-input]");
  newTaskDeadlineInput = newTask.querySelector(
    "[data-new-task-deadline-input]"
  );
  newTaskDescriptionInput = newTask.querySelector(
    "[data-new-task-description-input]"
  );
  newTaskSubtaskContainer = newTask.querySelector(
    "[data-new-subtask-container]"
  );

  const appendFirst = new Promise((resolve, reject) => {
    const first = modalLargeContainer.appendChild(newTask);
    resolve(first);
  });
  appendFirst
    .then(() => setNewTaskInputEvents())
    .then(() => setModalLargeHeader("new-task"))
    .then(() => changeDisplayState.show("overlay-lg", "modal-lg"));
}

function setModalLargeHeader(containerName) {
  const textContainer = modalLargeHeader.querySelector(
    "[data-task-panel-text-container]"
  );
  const headerText = modalLargeHeader.querySelector("[data-task-panel-text]");
  const textToPrint = containerName.replace(/-/g, " ");
  textContainer.dataset.taskPanelTextContainer = containerName;
  modalLargeHeader.dataset.taskPanelHeader = containerName;
  headerText.innerText = textToPrint;
}

const checkTaskOnModalContainerValue = (e) => {
  const containerType = e.target.closest("ul").dataset.taskContainer;
  return containerType;
};

function renderTaskCardOnModal(e) {
  setModalLargeHeader(checkTaskOnModalContainerValue(e));
  setTaskOnModal();
  changeDisplayState.show("overlay-lg", "modal-lg");
}

function setTaskOnModal() {
  if (!selectedTaskId) return;
  clearElement(modalLargeContainer);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId);
  taskCardRemoveOpenModal(selectedTask.id);
  selectedTask.onModal = true;
  save();
  renderAndReOpen();
}

function taskCardRemoveOpenModal(cardId) {
  const taskCardLi = document.querySelector(`[data-task-id="${cardId}"]`);
  const taskCardCompactDiv = taskCardLi.firstElementChild;
  taskCardCompactDiv.classList.remove("open-modal");
}

function resetTaskOnModal(e) {
  if (tasks.length < 1) return;
  const selectedTask = tasks.find((task) => task.onModal === true);
  if (!selectedTask) return;
  selectedTask.onModal = false;
  clearElement(modalLargeContainer);
  save();
}

function isTaskCard(e) {
  return e.target.parentNode.dataset.taskId;
}

document.addEventListener("click", (e) => {
  if (isTaskCard(e)) {
    selectTask(e);
  }
  if (e.target.dataset.cardButton === "delete-task") {
    showMessageBoxToAsk.toDelete();
  }
  if (e.target.dataset.cardButton === "complete-task") {
    showMessageBoxToAsk.toComplete();
  }
  if (e.target.dataset.cardButton === "add-subtask") {
    hideShowAddSubtask(e);
    toggleAddRemoveIcon(e);
  }
  if (e.target.dataset.addSubtaskButton === "add-to-list") {
    addSubtask(e);
  }
});

document.addEventListener("change", (e) => {
  if (!selectedTaskId) return;
  if (e.target.type === "checkbox") {
    e.stopPropagation();
    subtaskComplete(e);
  }
});

function selectTask(e) {
  selectedTaskId = e.target.parentNode.dataset.taskId;
  save();
}

function deleteTask() {
  tasks = tasks.filter((task) => task.id !== selectedTaskId);
  selectedTaskId = null;
}

function completeTask() {
  const selectedTask = tasks.find((task) => task.id === selectedTaskId);
  selectedTask.status = "completed";
  selectedTaskId = null;
  save();
}

function addSubtask(e) {
  const subtaskInput = e.target.nextElementSibling;
  if (subtaskInput.tagName.toLowerCase() !== "textarea") return;
  const subtaskValue = subtaskInput.value;
  if (!subtaskValue.trim().length > 0) return;
  const selectedTask = tasks.find((task) => task.id === selectedTaskId);
  const taskId = selectedTask.id;
  const subtasksArray = selectedTask.subtasks;
  let newId;
  if (subtasksArray.length === 0) {
    newId = taskId + 1;
  } else {
    const lastItem = subtasksArray[subtasksArray.length - 1];
    newId = lastItem.id + 1;
  }
  const subtask = createSubtask(newId, subtaskValue);
  selectedTask.subtasks.push(subtask);
  save();
  renderAndReOpen(taskId);
}
function subtaskComplete(e) {
  const selectedTask = tasks.find((task) => task.id === selectedTaskId);
  const taskId = selectedTask.id;
  const selectedSubtask = selectedTask.subtasks.find(
    (subtask) => subtask.id === e.target.id
  );
  selectedSubtask.complete = e.target.checked;
  save();
  renderAndReOpen(taskId);
}
function hideShowAddSubtask(e) {
  const taskCardLi = e.target.closest("li");
  const addSubtaskPanel = taskCardLi.querySelector(".static-bottom");
  toggleHideShow(addSubtaskPanel);
}
function toggleAddRemoveIcon(e) {
  let iconText = e.target.querySelector("i");
  if (iconText.textContent === "add") {
    iconText.textContent = "remove";
  } else if (iconText.textContent === "remove") {
    iconText.textContent = "add";
  } else {
    iconText.textContent = "remove";
  }
}
function subtaskCount() {
  tasks.forEach((task) => {
    const taskId = task.id;
    const totalCount = task.subtasks.length;
    const completedCount = task.subtasks.filter(
      (subtask) => subtask.complete === true
    ).length;
    const inCompletedCount = totalCount - completedCount;
    renderSubtaskCount(taskId, inCompletedCount, totalCount);
    const completionRate = (completedCount / totalCount) * 100 || 0;
    renderSubtaskProgress(taskId, completionRate);
  });
}
function renderSubtaskProgress(Id, rate) {
  const taskCardLi = document.querySelector(`[data-task-id="${Id}"]`);
  const progressFill = taskCardLi.querySelector(`[data-progress-fill]`);
  const progressValue = taskCardLi.querySelector(`[data-progress-value]`);
  const roundedRate = Math.round(rate) + "%";
  const percentage = rate + "%";
  progressValue.innerText = roundedRate;
  progressFill.style.width = percentage;
}
function renderSubtaskCount(Id, inCompletedCount, totalCount) {
  const taskCardLi = document.querySelector(`[data-task-id="${Id}"]`);
  const subtaskText = taskCardLi.querySelector(`[data-subtasks-left]`);
  if (totalCount === 0) {
    subtaskText.innerText = `No tasks yet`;
  } else if (inCompletedCount === 0 && totalCount > 0) {
    subtaskText.innerText = `Completed!`;
  } else {
    subtaskText.innerText = `${inCompletedCount} Left`;
  }
}

const getData = function () {
  const taskId = Date.now().toString();
  const taskName = newTaskNameInput.value;
  const taskStarts = newTaskStartInput.value;
  const taskEnds = newTaskDeadlineInput.value;
  const taskDescription = newTaskDescriptionInput.value;
  pushData(taskId, taskName, taskStarts, taskEnds, taskDescription);
};

function pushData(taskId, taskName, taskStarts, taskEnds, taskDescription) {
  //should return some error to
  if (taskName == null || taskName === "") return;
  if (validateTaskDate() !== "Good to go") return;
  const task = createTask(
    taskId,
    taskName,
    taskStarts,
    taskEnds,
    taskDescription
  );
  tasks.push(task);
  makeSubtaskArray(taskId);
  save();
  renderAndReOpen();
  resetForm();
}

function resetForm() {
  newTaskNameInput.value = "";
  newTaskDescriptionInput.value = "";
  clearElement(newTaskSubtaskContainer);
  resetNewtaskIcons();
}

function resetNewtaskIcons() {
  const switchIcons = newTaskPanel.querySelectorAll(".toggle-switch");
  switchIcons.forEach((icon) => {
    if (icon.textContent == "toggle_on") {
      toggleSwitchIcon(icon);
      toggleHideShow(icon.parentElement.nextElementSibling);
    }
  });
}

function makeSubtaskArray(Id) {
  let selectAllSubtaskForms = document.querySelectorAll(".new-subtask");
  let subtaskFormsArray = [...selectAllSubtaskForms];
  let notEmpty = subtaskFormsArray.filter((e) => e.value.trim().length > 0);
  let len = notEmpty.length;
  const getTask = tasks.find((task) => task.id === Id);
  for (let i = 0; i < len; i++) {
    let subtask = createSubtask(Id + i, notEmpty[i].value);
    getTask.subtasks.push(subtask);
  }
  save();
}

function renderTasks() {
  clearElement(completedTasksContainer);
  clearElement(currentTasksContainer);
  clearElement(urgentTasksContainer);
  clearElement(longTermTasksContainer);
  tasks.forEach((task) => {
    const taskCardElement = document.importNode(taskCardTemplate.content, true);
    const taskCardListElement = taskCardElement.querySelector(".task-card-li");
    const taskName = taskCardElement.querySelector("[data-task-name]");
    const taskRemaining = taskCardElement.querySelector(
      "[data-task-remaining]"
    );
    const taskStart = taskCardElement.querySelector("[data-task-start]");
    const taskDeadline = taskCardElement.querySelector("[data-task-deadline]");
    const taskDescription = taskCardElement.querySelector(
      "[data-task-description]"
    );
    const subtaskContainer = taskCardElement.querySelector(
      "[data-subtasks-container]"
    );
    const daysUntilDeadline = taskDatesToDisplay(task.deadline);
    taskName.append(task.name);
    taskStart.append(task.startFrom);
    taskDeadline.append(task.deadline);
    taskDescription.append(task.description);
    taskRemaining.append(daysUntilDeadline);
    taskCardListElement.dataset.taskId = task.id;
    task.status = taskStatusAssigner(task);
    renderTaskCardsByStatus(task.id, task.status, taskCardElement);
    if (task.subtasks.length > 0) {
      renderSubtasks(task, subtaskContainer);
    }
    renderCardAddSubtask(subtaskContainer);
  });
}
function calculateTaskDates(deadline) {
  const todayMilisec = Date.now();
  const deadlineMilisec = Date.parse(deadline);
  const oneDay = 1000 * 60 * 60 * 24;
  // const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const differenceMilisec = deadlineMilisec - todayMilisec;
  const deadlineInDays = differenceMilisec / oneDay;
  return deadlineInDays;
}
function taskDatesToDisplay(deadlineDate) {
  const deadlineInDays = calculateTaskDates(deadlineDate);
  const hasDeadlinePassed = Math.sign(deadlineInDays) < 0;
  const isBetweenZeroAndOne = Math.abs(deadlineInDays) < 1;
  const result = isBetweenZeroAndOne ? 1 : Math.round(Math.abs(deadlineInDays));
  return hasDeadlinePassed ? "-" + result + "d" : result + "d";
}
function isTaskStatusCompletedOrCurrent(status) {
  return status === "completed" || status === "current";
}
function checkTaskStatusRange(deadline) {
  const dateRangeForUrgent = 7;
  const dayDifference = calculateTaskDates(deadline);
  return dayDifference > dateRangeForUrgent;
}

function taskStatusAssigner(task) {
  const isCurrentOrCompleted = isTaskStatusCompletedOrCurrent(task.status);
  const taskState = checkTaskStatusRange(task.deadline)
    ? "long-term"
    : "urgent";
  return isCurrentOrCompleted ? task.status : taskState;
}

function renderTaskCardsByStatus(taskID, status, taskCardElement) {
  const taskContainer = status + "-tasks";
  locateTaskCards(taskID, taskContainer, taskCardElement);
  save();
}

function updateTaskStatus({ selectedTask, newStatus, newDeadline }) {
  selectedTask.status = newStatus;
  selectedTask.deadline = newDeadline;
  save();
}

//RENDER BY DRAG ORDER
function getCurrentOrder(taskCardId) {
  const cardId = taskCardId;
  pushCurrentOrder(cardId);
}
const TASK_CARD_ORDERED_TEMP = [];
function pushCurrentOrder(cardId) {
  TASK_CARD_ORDERED_TEMP.push(cardId);
  saveOrderedTasks();
}
function saveOrderedTasks() {
  const currentTasks = [...tasks];
  const newTaskOrders = [...TASK_CARD_ORDERED_TEMP];
  const sortBy = "id";
  tasks = mapOrder(currentTasks, newTaskOrders, sortBy);
  save();
}
function mapOrder(array, order, key) {
  array.sort(function (a, b) {
    let A = a[key],
      B = b[key];
    if (order.indexOf(A) > order.indexOf(B)) {
      return 1;
    } else {
      return -1;
    }
  });
  return array;
}

function orderCardLists() {
  TASK_CARD_ORDERED_TEMP.length = 0;
  const taskCardLi = document.querySelectorAll("[data-task-id]");
  taskCardLi.forEach((li) => {
    getCurrentOrder(li.dataset.taskId);
  });
}
function updateDraggedTaskCardStatus(taskCard) {
  const taskCardId = taskCard.dataset.taskId;
  const newContainerName = taskCard.parentElement.dataset.taskContainer;
  showMessageBoxToAsk.toRelocate(taskCardId, newContainerName);
}

function checkIsOnModal(cardId) {
  const selectedTask = tasks.find((task) => task.id === cardId);
  return selectedTask.onModal;
}
function determineContainer(taskId, name) {
  if (checkIsOnModal(taskId)) {
    clearElement(modalLargeContainer);
    return modalLargeContainer;
  } else {
    const cardContainer = document.getElementById(`${name}`);
    return cardContainer;
  }
}
function locateTaskCards(taskId, containerName, taskCard) {
  const name = containerName;
  const containerFirst = new Promise((resolve, reject) => {
    const container = determineContainer(taskId, name);
    resolve(container);
  });
  containerFirst
    .then((container) => {
      container.appendChild(taskCard);
    })
    .then(() => defineAndRenderCardShadows(taskId, name))
    .then(() => checkScreenWidth());
}

function defineAndRenderCardShadows(id, name) {
  const taskCard = document.querySelector(`[data-task-id="${id}"]`);
  const subtaskCardDiv = taskCard.querySelectorAll(".card-subtask");
  const containerName = name;
  const shadowType = containerName.replace("tasks", "shadow");
  renderCardShadows(shadowType, taskCard, subtaskCardDiv);
}
function renderCardShadows(shadow, taskCard, subtaskCards) {
  clearCardShadows(taskCard, subtaskCards);
  taskCard.classList.add(shadow);
  subtaskCards.forEach((card) => {
    card.classList.add(shadow);
  });
}
function clearCardShadows(taskCard, subtaskCards) {
  const shadowTypes = [
    "completed-shadow",
    "current-shadow",
    "urgent-shadow",
    "long-term-shadow",
  ];
  for (let shadowType of shadowTypes) {
    if (taskCard.classList.contains(shadowType)) {
      taskCard.classList.remove(shadowType);
      subtaskCards.forEach((card) => card.classList.remove(shadowType));
    }
  }
}

function renderSubtasks(taskList, subtaskCardContainer) {
  clearElement(subtaskCardContainer);
  taskList.subtasks.forEach((subtask) => {
    const subtaskListElement = document.importNode(
      subtaskListTemplate.content,
      true
    );
    const checkbox = subtaskListElement.querySelector("input");
    checkbox.id = subtask.id;
    checkbox.checked = subtask.complete;
    const label = subtaskListElement.querySelector("label");
    label.htmlFor = subtask.id;
    label.append(subtask.name);
    subtaskCardContainer.appendChild(subtaskListElement);
  });
}
function renderCardAddSubtask(subtaskCardContainer) {
  const addToListElement = document.importNode(
    addSubtaskTemplate.content,
    true
  );

  const li = addToListElement.querySelector("li");
  li.classList.add("static-bottom");

  const containerDiv = addToListElement.querySelector("div");
  containerDiv.classList.add("card-subtask");

  const textArea = addToListElement.querySelector("textarea");
  textArea.classList.add("card-add-subtask-textarea");
  textArea.addEventListener("input", autoGrowTextArea, false);

  const button = addToListElement.querySelector("button");
  button.classList.add("card-add-subtask-button");
  button.dataset.addSubtaskButton = "add-to-list";
  const icon = button.querySelector("i");
  icon.classList.add("card-add-subtask-icon");
  subtaskCardContainer.appendChild(addToListElement);
}
function renderNewTaskAddSubtask() {
  const newSubtaskTemplate = document.importNode(
    addSubtaskTemplate.content,
    true
  );
  const li = newSubtaskTemplate.querySelector("li");
  const containerDiv = newSubtaskTemplate.querySelector("div");
  containerDiv.classList.add("subtask-div");
  const button = newSubtaskTemplate.querySelector("button");
  button.dataset.addSubtaskButton = "press-hold";
  const icon = button.querySelector("i");
  const textArea = newSubtaskTemplate.querySelector("textarea");
  textArea.classList.add("new-subtask");
  button.classList.add("subtask-add-icon-div");
  setNewTaskAddSubtaskEvents(textArea);
  newTaskSubtaskContainer.appendChild(newSubtaskTemplate);
}

function setNewTaskAddSubtaskEvents(textArea) {
  textArea.addEventListener("input", autoGrowTextArea, false);
  textArea.addEventListener("focus", subtaskFocusActions, false);
  textArea.addEventListener("blur", subtaskBlurActions, false);
  textArea.addEventListener("change", validateSubtask, false);
}

function subtaskFocusActions(e) {
  const textArea = e.currentTarget;
  const buttonIcon = textArea.previousElementSibling.firstElementChild;
  setIcon(buttonIcon, "add_circle");
  textArea.select();
}

function subtaskBlurActions(e) {
  const textArea = e.currentTarget;
  const button = textArea.previousElementSibling;
  const buttonIcon = button.firstElementChild;
  setIcon(buttonIcon, "edit");
  setPressHoldEvents(button);
}

//DRAG DROP STARTS HERE
const dragDropTaskCards = (function () {
  let selectedToDrag;
  function dragStarted(e) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", null);
    selectedToDrag = e.currentTarget;
  }
  function dragginOver(e) {
    e.stopPropagation();
    if (isParent(selectedToDrag, e.currentTarget)) {
      e.currentTarget.appendChild(selectedToDrag);
    } else if (isBefore(selectedToDrag, e.currentTarget)) {
      e.currentTarget.parentNode.insertBefore(selectedToDrag, e.currentTarget);
    } else {
      e.currentTarget.parentNode.insertBefore(
        selectedToDrag,
        e.currentTarget.nextElementSibling
      );
    }
  }
  function isParent(elOne, elTwo) {
    let current;
    if (elTwo.tagName.toLowerCase() === "ul") {
      for (current = elOne.parentNode; current; current = current.parentNode) {
        if (current.tagName === elTwo.tagName) {
          return true;
        }
      }
    }
    return false;
  }
  function isBefore(elOne, elTwo) {
    let current;
    if (elTwo.parentNode === elOne.parentNode) {
      for (
        current = elOne.previousSibling;
        current;
        current = current.previousSibling
      ) {
        if (current === elTwo) {
          return true;
        }
      }
    }
    return false;
  }
  function dragEnded(e) {
    const orderFirst = new Promise((resolve, reject) => {
      const first = orderCardLists();
      resolve(first);
    });
    orderFirst
      .then(() => {
        updateDraggedTaskCardStatus(selectedToDrag);
      })
      .then(() => {
        selectedToDrag = null;
      });
  }
  function initDragDropEvents() {
    const taskCardLists = mainPageContainer.querySelectorAll(".task-card-li");
    const taskContainers = mainPageContainer.querySelectorAll(
      "[data-task-container]"
    );
    taskCardLists.forEach((listItem) => {
      listItem.addEventListener("dragstart", dragStarted, false);
      listItem.addEventListener("dragover", dragginOver, false);
      listItem.addEventListener("dragend", dragEnded, false);
    });
    taskContainers.forEach((container) => {
      container.addEventListener("dragover", dragginOver, false);
    });
  }

  return {
    init: initDragDropEvents,
  };
})();

function save() {
  localStorage.setItem(LOCAL_STORAGE_TASK_LIST_KEY, JSON.stringify(tasks));
  localStorage.setItem(
    LOCAL_STORAGE_SELECTED_TASK_LIST_ID,
    JSON.stringify(tasks)
  );
}
function render() {
  renderTasks();
}
function saveAndRender() {
  save();
  render();
}
function renderAndReOpen(taskId) {
  const renderFirst = new Promise((resolve, reject) => {
    const getFirst = render();
    resolve(getFirst);
  });
  renderFirst
    .then(() => taskCardToggle(taskId))
    .then(() => subtaskCount())
    .then(() => dragDropTaskCards.init());
}

function clearElement(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}
function createTask(id, name, startFrom, deadline, description) {
  return {
    id: id,
    creationDate: Date.now(),
    name: name,
    startFrom: startFrom,
    deadline: deadline,
    description: description,
    status: null,
    onModal: false,
    subtasks: [],
  };
}
function createSubtask(id, name) {
  return {
    id: id,
    name: name,
    complete: false,
  };
}

//smooth scroll and navigation part
const setNavbarMobileButtonsEvent = () => {
  mobileNavContainer.addEventListener("click", mobileNavButtonActions, false);
};
function mobileNavButtonActions(e) {
  let scrollButton = e.target.dataset.navbarScrollButton;
  navButtonJumpTo(scrollButton);
}
const getScrollButtonValue = function (buttonType) {
  return {
    completed: 0,
    current: 1,
    urgent: 2,
    longterm: 3,
  }[buttonType];
};
const navButtonJumpTo = function (scrollButton) {
  const scrollContainer = mainPageContainer;
  const buttonValue = getScrollButtonValue(scrollButton);
  navScrollValue = screenWidth * buttonValue;
  scrollContainer.scrollTo(navScrollValue, 0);
};

const scrollingOn = () => {
  mainPageContainer.addEventListener("scroll", smoothScrolling);
  setTimeout(scrollingOff, 800);
};

const scrollingOff = () => {
  mainPageContainer.removeEventListener("scroll", smoothScrolling);
  clearTimeout(smoothScrolling);
};

var pastScrollValue = 0;
var differenceScrollValue = 0;
var navScrollValue = 0;
const smoothScrolling = function () {
  const scrollContainer = mainPageContainer;
  let scrollValue = scrollContainer.scrollLeft;
  differenceScrollValue =
    differenceScrollValue + (scrollValue - pastScrollValue);
  pastScrollValue = scrollValue;

  if (differenceScrollValue > screenWidth / 8) {
    var nextScrollValue =
      Math.ceil(pastScrollValue / screenWidth) * screenWidth;
    scrollContainer.scrollTo(nextScrollValue, 0);
    setTimeout(function () {
      differenceScrollValue = 0;
    });
    pastScrollValue = scrollValue;
  } else if (differenceScrollValue < -(screenWidth / 8)) {
    var previousScrollValue =
      Math.floor(pastScrollValue / screenWidth) * screenWidth;

    scrollContainer.scrollTo(previousScrollValue, 0);
    setTimeout(function () {
      differenceScrollValue = 0;
    });
    pastScrollValue = scrollValue;
  }

  setTimeout(function () {
    var defaultScrollValue =
      Math.round(pastScrollValue / screenWidth) * screenWidth;
    scrollContainer.scrollTo(defaultScrollValue, 0);
  }, 700);
};

//toggle hide/show

const toggleSwitchIcon = function (icon) {
  icon.classList.toggle("on");
  if (icon.textContent === "toggle_off") {
    icon.textContent = "toggle_on";
  } else if (icon.textContent === "toggle_on") {
    icon.textContent = "toggle_off";
  } else {
    icon.textContent = "toggle_on";
  }
};

const setFocus = function (el = document.querySelectorAll(".new-subtask")) {
  let i = el.length - 1;
  el[i].focus();
};

const isTextArea = (el) => {
  let textAreas = el.querySelectorAll("textarea");
  if (!textAreas) return;
  textAreas.length === 0 ? validateSubtask(textAreas) : setFocus(textAreas);
};

const toggleHideShow = function (elem) {
  elem.classList.toggle("is-visible");
  isTextArea(elem);
};

function autoGrowTextArea(element) {
  element.currentTarget.style.height = "34px";
  element.currentTarget.style.height =
    element.currentTarget.scrollHeight + "px";
}

document.addEventListener(
  "click",
  function (event) {
    if (!event.target.classList.contains("toggle")) return;
    let content = event.target.nextElementSibling;
    let switchIcon = event.target.querySelector(".toggle-switch");
    if (!content) return;
    else if (content.classList.contains("toggle-content")) {
      toggleHideShow(content);
    }
    if (!switchIcon) return;
    else {
      toggleSwitchIcon(switchIcon);
    }
  },
  false
);

//PressHold and Fire event
let pressHoldTimerID;
let pressHoldCounter = 0;
let pressHoldDuration = 50;
let pressHoldEvent = new CustomEvent("pressHold");
let clickedElement;
function pressingDown(e) {
  //this starts timer
  requestAnimationFrame(pressingTimer);
  e.preventDefault();
  clickedElement = e.currentTarget;
}
function notPressingDown(e) {
  //this stops timer
  cancelAnimationFrame(pressHoldTimerID);
  pressHoldCounter = 0;
}

function pressingTimer(e) {
  if (pressHoldCounter < pressHoldDuration) {
    pressHoldTimerID = requestAnimationFrame(pressingTimer);
    pressHoldCounter++;
  } else {
    clickedElement.dispatchEvent(pressHoldEvent);
  }
}
//the function that changes the icon
function setForSwipeToDelete(e) {
  const elementContainer = clickedElement.closest("li");
  const buttonIcon = clickedElement.firstElementChild;
  setIcon(buttonIcon, "delete_sweep");
  setSwipeToDeleteEvents(elementContainer);
}

function setSwipeToDeleteEvents(element) {
  element.addEventListener("touchstart", swipeStarted, false);
  element.addEventListener("touchmove", swipeContinues, false);
  element.addEventListener("touchend", swipeFinished, false);
}

function setPressHoldEvents(button) {
  button.addEventListener("mousedown", pressingDown, false);
  button.addEventListener("mouseup", notPressingDown, false);
  button.addEventListener("mouseleave", notPressingDown, false);
  button.addEventListener("touchstart", pressingDown, false);
  button.addEventListener("touchend", notPressingDown, false);
  button.addEventListener("pressHold", setForSwipeToDelete, false);
}

//swipe to delete part
var currentClientX;
var firstClientX;
var getCurrentTarget;
var deltaXDiv;
var swipeContainerWidth;

function swipeStarted(e) {
  firstClientX = e.touches[0].clientX;
  currentClientX = firstClientX;
  getCurrentTarget = e.currentTarget;
  swipeContainerWidth = newTaskSubtaskContainer.offsetWidth;
}
function swipeContinues(e) {
  currentClientX = e.touches[0].clientX;
  let elementPos = currentClientX - firstClientX;
  getCurrentTarget.style.transform = "translateX(" + elementPos + "px)";
}
function swipeFinished(e) {
  deltaXDiv = currentClientX - firstClientX;
  if (deltaXDiv > swipeContainerWidth / 4) {
    let positionCounter = setInterval(newPosition, 20);
    let itemToDelete = getCurrentTarget;
    function newPosition() {
      if (deltaXDiv <= swipeContainerWidth) {
        deltaXDiv = deltaXDiv + swipeContainerWidth / 20;
        getCurrentTarget.style.transform = "translateX(" + deltaXDiv + "px)";
      } else if (swipeContainerWidth - deltaXDiv <= swipeContainerWidth / 20) {
        getCurrentTarget.style.transform =
          "translateX(" + swipeContainerWidth + "px)";
        clearInterval(positionCounter);
        //This part calls delete
        removeSubtaskDiv(itemToDelete);
      }
    }
  } else {
    if (deltaXDiv !== undefined) {
      let positionCounter = setInterval(newPosition, 20);
      function newPosition() {
        if (deltaXDiv > 0) {
          deltaXDiv = deltaXDiv - swipeContainerWidth / 50;
          getCurrentTarget.style.transform = "translateX(" + deltaXDiv + "px)";
        } else if (deltaXDiv <= 0) {
          getCurrentTarget.style.transform = "translateX(" + 0 + "px)";
          clearInterval(positionCounter);
        }
      }
    }
  }
}
function removeSubtaskDiv(element) {
  element.remove();
  validateSubtask();
}

window.onload = function () {
  initModals();
  setNavbarMobileButtonsEvent();
  mainPageContainer.ontouchstart = scrollingOn;
  resetTaskOnModal();
  renderAndReOpen();
};
