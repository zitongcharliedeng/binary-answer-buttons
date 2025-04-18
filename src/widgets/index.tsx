import { declareIndexPlugin, ReactRNPlugin, AppEvents, RNPlugin, WidgetLocation, QueueInteractionScore } from '@remnote/plugin-sdk';
import '../style.css';
import '../App.css';

type AnswerButton = 'immediately' | 'with-effort' | 'partial' | 'forgotten' | 'too-soon';
interface ButtonSetting {
  id: string;
  buttonName: AnswerButton;
}

const queueInteractionScoreToButtonName: Record<QueueInteractionScore, AnswerButton> = {
  [QueueInteractionScore.EASY]: 'immediately',
  [QueueInteractionScore.GOOD]: 'with-effort',
  [QueueInteractionScore.HARD]: 'partial',
  [QueueInteractionScore.AGAIN]: 'forgotten',
  [QueueInteractionScore.TOO_EARLY]: 'too-soon',
};

async function showEnableAudioWorkaroundPopup(
  plugin: RNPlugin,
) {
  await plugin.window.openFloatingWidget(
    "enable_audio_popup",
    { top: 0, bottom: 0, left: 0, right: 0 },
    undefined,
  );
}

async function numberOfAnswerButtonsVisible(plugin: ReactRNPlugin): Promise<number> {
  let visibleCount = 0;
  for (const buttonName of [
    'immediately',
    'with-effort',
    'partial',
    'forgotten',
    'too-soon',
  ]) {
    const isVisible = await plugin.settings.getSetting(`display__${buttonName}`);
    if (isVisible) {
      visibleCount++;
    }
  }
  return visibleCount;
}

async function getSavedDisplayStyleForButton(buttonName: AnswerButton, plugin: ReactRNPlugin): Promise<'none' | 'inherit'> {
  const isVisible = await plugin.settings.getSetting<boolean>(`display__${buttonName}`);
  return isVisible ? 'inherit' : 'none';
}

async function getSavedBackgroundColorStyleForButton(buttonName: AnswerButton, plugin: ReactRNPlugin): Promise<string> {
  const cssColorName = await plugin.settings.getSetting<string>(`background-color__${buttonName}`)
  return cssColorName ?? 'transparent';
}

async function getSavedContentOpacityStyleForButton(buttonName: AnswerButton, plugin: ReactRNPlugin): Promise<'0' | '1'> {
  const isVisible = await plugin.settings.getSetting<boolean>(`content-opacity__${buttonName}`);
  return isVisible ? '1' : '0';
}

async function getSavedSoundEffectSrcForButton(buttonName: AnswerButton, plugin: ReactRNPlugin): Promise<string> {
  const soundEffectSrc = await plugin.settings.getSetting<string>(`sound-effect__${buttonName}`);
  return soundEffectSrc ?? '';
}

async function registerPluginCss(plugin: ReactRNPlugin): Promise<void> {
  plugin.app.registerCSS(
    'queue-container',
    `
      .rn-queue__answer-btn--immediately {
        display: ${await getSavedDisplayStyleForButton('immediately', plugin)};
        background-color: ${await getSavedBackgroundColorStyleForButton('immediately', plugin)} !important;
      }
      .rn-queue__answer-btn--immediately > * {
        opacity: ${await getSavedContentOpacityStyleForButton('immediately', plugin)} !important;
      }

      .rn-queue__answer-btn--with-effort {
        display: ${await getSavedDisplayStyleForButton('with-effort', plugin)};
        background-color: ${await getSavedBackgroundColorStyleForButton('with-effort', plugin)} !important;
      }
      .rn-queue__answer-btn--with-effort > * {
        opacity: ${await getSavedContentOpacityStyleForButton('with-effort', plugin)} !important;
      }
      
      .rn-queue__answer-btn--partial {
        display: ${await getSavedDisplayStyleForButton('partial', plugin)};
        background-color: ${await getSavedBackgroundColorStyleForButton('partial', plugin)} !important;
      }
      .rn-queue__answer-btn--partial > * {
        opacity: ${await getSavedContentOpacityStyleForButton('partial', plugin)} !important;
      }
      
      .rn-queue__answer-btn--forgotten {
        display: ${await getSavedDisplayStyleForButton('forgotten', plugin)};
        background-color: ${await getSavedBackgroundColorStyleForButton('forgotten', plugin)} !important;
      }
      .rn-queue__answer-btn--forgotten > * {
        opacity: ${await getSavedContentOpacityStyleForButton('forgotten', plugin)} !important;
      }

      .rn-queue__answer-btn--too-soon {
        display: ${await getSavedDisplayStyleForButton('too-soon', plugin)};
        background-color: ${await getSavedBackgroundColorStyleForButton('too-soon', plugin)} !important;
      }
      .rn-queue__answer-btn--too-soon > * {
        opacity: ${await getSavedContentOpacityStyleForButton('too-soon', plugin)} !important;
      }

      .spaced-repetition__accuracy-buttons {
        grid-template-columns: repeat(${await numberOfAnswerButtonsVisible(plugin)}, minmax(0, 1fr)) !important;
      }
    `
  );
}

async function onActivate(plugin: ReactRNPlugin): Promise<void> {
  const allDisplayPluginSettings: ButtonSetting[] = [
    { id: "display__immediately", buttonName: "immediately" },
    { id: "display__with-effort", buttonName: "with-effort" },
    { id: "display__partial", buttonName: "partial" },
    { id: "display__forgotten", buttonName: "forgotten" },
    { id: "display__too-soon", buttonName: "too-soon" },
  ];
  const allBackgroundColorPluginSettings: ButtonSetting[] = [
    { id: "background-color__immediately", buttonName: "immediately" },
    { id: "background-color__with-effort", buttonName: "with-effort" },
    { id: "background-color__partial", buttonName: "partial" },
    { id: "background-color__forgotten", buttonName: "forgotten" },
    { id: "background-color__too-soon", buttonName: "too-soon" },
  ];
  const allContentOpacityPluginSettings: ButtonSetting[] = [
    { id: "content-opacity__immediately", buttonName: "immediately" },
    { id: "content-opacity__with-effort", buttonName: "with-effort" },
    { id: "content-opacity__partial", buttonName: "partial" },
    { id: "content-opacity__forgotten", buttonName: "forgotten" },
    { id: "content-opacity__too-soon", buttonName: "too-soon" },
  ];
  const allSoundEffectPluginSettings: ButtonSetting[] = [
    { id: "sound-effect__immediately", buttonName: "immediately" },
    { id: "sound-effect__with-effort", buttonName: "with-effort" },
    { id: "sound-effect__partial", buttonName: "partial" },
    { id: "sound-effect__forgotten", buttonName: "forgotten" },
    { id: "sound-effect__too-soon", buttonName: "too-soon" },
  ];
  const toRegisterAllPluginSettings = [
    ...allDisplayPluginSettings.map((setting) => {
      plugin.event.addListener(AppEvents.SettingChanged, `${setting.id}`, async () => {
        await registerPluginCss(plugin);
      });
      return plugin.settings.registerBooleanSetting({
        id: setting.id,
        title: `Show '${setting.buttonName}' answer button`,
        defaultValue: true,
      })
    }),
    ...allBackgroundColorPluginSettings.map((setting) => {
      plugin.event.addListener(AppEvents.SettingChanged, `${setting.id}`, async () => {
        await registerPluginCss(plugin);
      });
      return plugin.settings.registerStringSetting({
        id: setting.id,
        title: `Background color for '${setting.buttonName}' answer button. 
          Use a CSS color names without wrapping in quotations ("") or semicolons at the end: e.g. "red", or "#FF5733", or "rgb(0 0 255 / 50%)"`,
        defaultValue: 'transparent',
      })
    }),
    ...allContentOpacityPluginSettings.map((setting) => {
      plugin.event.addListener(AppEvents.SettingChanged, `${setting.id}`, async () => {
        await registerPluginCss(plugin);
      });
      return plugin.settings.registerBooleanSetting({
        id: setting.id,
        title: `Show contents (text, emoji, SRS timings) inside '${setting.buttonName}' answer button`,
        defaultValue: true,
      })
    }),
    ...allSoundEffectPluginSettings.map((setting) => {
      return plugin.settings.registerStringSetting({
        id: setting.id,
        title: `Custom sound effect to play when completing the ${setting.buttonName} answer button. 
          Use a URL which points to a sound e.g. "https://www.myinstants.com/media/sounds/yeahoo.mp3". 
          You can find links like this in the browser's Network Console from any site triggering an audio effect. 
          This method doesn't require downloads or uploads but will require internet..?`,
        defaultValue: 'https://cdn.pixabay.com/audio/2024/01/09/audio_198f24b361.mp3',
      })
    }),
  ];
  await Promise.all(toRegisterAllPluginSettings);

  // Register the CSS styles for the first time of the session.
  await registerPluginCss(plugin);

  plugin.event.addListener(AppEvents.QueueCompleteCard, undefined, async (data) => {
    const answerButtonName = queueInteractionScoreToButtonName[data.score as QueueInteractionScore];
    const audioSrc: string = await getSavedSoundEffectSrcForButton(answerButtonName, plugin); 
    new Audio(audioSrc).play()
      .catch((error) => {
        console.error('Error playing answer button audioSrc:', error);
      });
  });

  // Workaround for stackoverflow.com/questions/49930680
  plugin.event.addListener(AppEvents.QueueEnter, undefined, async () => {
    await showEnableAudioWorkaroundPopup(plugin);
  });
  await plugin.app.registerCommand({
    id: "showEnableAudioWorkaroundPopup",
    name: "Show the popup for enabling answer button sound effects.",
    action: () => showEnableAudioWorkaroundPopup(plugin),
  });
  await plugin.app.registerWidget(
    "enable_audio_popup",
    WidgetLocation.FloatingWidget,
    {
      dimensions: {
        width: 300,
        height: "auto",
      },
    }
  );
}
async function onDeactivate(_: ReactRNPlugin): Promise<void> {}
declareIndexPlugin(onActivate, onDeactivate);
