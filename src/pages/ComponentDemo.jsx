import React, { useState } from 'react';
import Button from '../components/Button';
import Checkbox from '../components/Checkbox';
import DateInput from '../components/DateInput';
import Divider from '../components/Divider';
import FileUpload from '../components/FileUpload';
import Slider from '../components/Slider';
import { TextInput, SearchInput, TextArea } from '../components/Input';
import SelectDropdown from '../components/SelectDropdown';
import Spacer from '../components/Spacer';
import StepperInput from '../components/StepperInput';
import Text from '../components/Text';
import ToggleSwitch from '../components/ToggleSwitch';
import Row from '../layout/containers/Row';
import Column from '../layout/containers/Column';
import Grid from '../layout/containers/Grid';
import Card from '../layout/containers/Card';
import FlexContainer from '../layout/containers/FlexContainer';
import { CircleUser } from 'lucide-react';
import AudioPlayer from '../components/AudioPLayer';
import WaveformPlayer from '../components/WaveformPlayer';
import Pill from '../components/pill';
import ClampText from '../components/ClampText';
import ImageCard from '../layout/containers/ImageCard'; 0
import RecordingIcon from '../components/RecordingIcon';
import PersonCard from '../components/PersonCard';
import PersonCardHorizontal from '../components/PersonCardHorizontal';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import WarningModal from '../components/modals/WarningModal';
import ErrorModal from '../components/modals/ErrorModal';
import InfoModal from '../components/modals/InfoModal';
import useToastStore from '../store/useToastStore';
import { useTranslation } from 'react-i18next';

const ComponentDemo = ({  setSidebarOpen  }) => {
  const [checked, setChecked] = useState(false);
  const [date, setDate] = useState('');
  const [step, setStep] = useState(1);
  const [dropdown, setDropdown] = useState('');
  const [toggle, setToggle] = useState(false);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [textarea, setTextarea] = useState('');
  const [sliderValue, setSliderValue] = useState(50);
  const [activeAudioIndex, setActiveAudioIndex] = useState(null);
  const [audioDurations, setAudioDurations] = useState({});
  const [audioTimes, setAudioTimes] = useState({});
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const addToast = useToastStore((state) => state.addToast);

  const { t } = useTranslation();

  const handleAudioActivate = (index) => {
    setActiveAudioIndex(prev => (prev === index ? null : index));
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ padding: 32 }}>
      <h1>{t("demo.title")}</h1>
      <Divider />

      <h2>{t("demo.texts")}</h2>
      <Text variant="heading1" bold color="primary-text" align="center">
        {t("demo.welcome")}
      </Text>

      <Text variant="caption2" italic color="danger">
        * {t("demo.warning")}
      </Text>

      <Text as="p" color="gray-dark">
        {t("demo.paragraph")}
      </Text>

      <Divider />

      <h2>{t("demo.clamp_text")}</h2>
      <Card padding="16px" backgroundColor="#f5f5f5" borderRadius="8px">
        <ClampText lines={2}>
          {t("demo.clamp_sample")}
        </ClampText>
      </Card>
      <Divider />

      <RecordingIcon isRecording={true}></RecordingIcon>

      <h2>{t("demo.buttons")}</h2>
      <Button onClick={() => alert('Clicked!')}>{t("buttons.primary")}</Button>
      <Spacer />
      <Button variant="secondary">{t("buttons.secondary")}</Button>
      <Spacer />
      <Button loading>{t("buttons.loading")}</Button>
      <Spacer />
      <Button disabled>{t("buttons.disabled")}</Button>
      <Spacer />
      <Button size='sm'>{t("buttons.small")}</Button>
      <Spacer />
      <Button size='md'>{t("buttons.medium")}</Button>
      <Spacer />
      <Button size='lg'>{t("buttons.large")}</Button>
      <Spacer />
      <Button variant='link'>{t("buttons.learn_more")}</Button>
      <Spacer />
      <Button fullWidth>{t("buttons.full_width")}</Button>
      <Divider />

      <h2>{t("demo.checkbox")}</h2>
      <Checkbox label={t("demo.accept_terms")} checked={checked} onChange={() => setChecked(!checked)} />
      <Divider />

      <h2>{t("demo.dateinput")}</h2>
      <DateInput label={t("demo.pick_date")} value={date} onChange={e => setDate(e.target.value)} />
      <Divider />

      <h2>{t("demo.divider")}</h2>
      <Divider />
      <Divider color="red" thickness="2px" borderRadius='2px' />
      <Divider vertical style={{ height: 40 }} />
      <Divider />

      <h2>{t("demo.fileupload")}</h2>
      <FileUpload onChange={() => {}} />
      <Divider />

      <h2>{t("demo.inputs")}</h2>
      <TextInput label={t("demo.name")} value={text} onChange={e => setText(e.target.value)} placeholder={t("demo.enter_name")} />
      <Spacer />
      <SearchInput
        placeholder={t("demo.search_placeholder")}
        value={search}
        onChange={setSearch}
        onSearch={val => alert(t("demo.searching") + ' ' + val)}
      />
      <Spacer />
      <TextArea label={t("demo.description")} value={textarea} onChange={e => setTextarea(e.target.value)} />
      <Divider />

      <h2>{t("demo.slider")}</h2>
      <Slider
        label={t("demo.volume")}
        min={0}
        max={100}
        step={2}
        value={sliderValue}
        onChange={setSliderValue}
      />
      <Divider />

      <h2>{t("demo.dropdown")}</h2>
      <SelectDropdown
        label={t("demo.choose")}
        options={[{ label: t("demo.one"), value: 1 }, { label: t("demo.two"), value: 2 }]}
        value={dropdown}
        onChange={e => setDropdown(e.target.value)}
      />
      <Divider />

      <h2>{t("demo.spacer")}</h2>
      <Spacer size="md" />
      <Spacer size="28px" />
      <Spacer size="lg" vertical={false} />
      <Divider />

      <h2>{t("demo.stepper")}</h2>
      <StepperInput value={step} onChange={setStep} />
      <Divider />

      <h2>{t("demo.toggle")}</h2>
      <ToggleSwitch
        checked={toggle}
        onChange={newValue => {
          setToggle(newValue);
        }}
      /> 
      <Divider />

      <h2>{t("demo.pills")}</h2>
      <Row gap="10px" alignItems="center">
        <Pill backgroundColor="#e0e0e0" color="#333">{t("demo.default_pill")}</Pill>
        <Pill backgroundColor="#007bff" color="white">{t("demo.primary_pill")}</Pill>
        <Pill backgroundColor="#28a745" color="white" icon={<CircleUser size={20} />}>
        </Pill>
      </Row>
      <Divider />

      <h2>{t("demo.row")}</h2>
      <Row gap="1rem" padding="1rem" justifyContent='space-between'  >
        <Card backgroundColor='#7c0786' height='50px' width='150px'>Card 2</Card>
        <Card backgroundColor='#7c0786' height='50px' width='150px'>Card 2</Card>
      </Row>
      <Divider />

      <h2>{t("demo.column")}</h2>
      <FlexContainer direction="column" height='400px'>
        <Column gap="1rem" padding="1rem" justifyContent='space-between' height='100%'>
          <Card backgroundColor='#1F724A' height='50px'> {t("demo.card1")} </Card>
          <Card backgroundColor='#1F724A' height='50px'> {t("demo.card2")} </Card>
        </Column>
      </FlexContainer>
      <Divider />

      <h2>{t("demo.flexible")}</h2>
      <FlexContainer direction="column" responsiveDirection="row" gap="1rem">
        <Card backgroundColor='#1F724A' height='50px'> {t("demo.card1")} </Card>
        <Card backgroundColor='#1F724A' height='50px'> {t("demo.card2")} </Card>
      </FlexContainer>
      <Divider />

      <h2>{t("demo.grid")}</h2>
      <Grid columns={2} gap="10px">
        <Card backgroundColor='#1F724A' height='50px' borderRadius='5px'> {t("demo.card1")} </Card>
        <Card backgroundColor='#1F724A' height='50px' borderRadius='5px'> {t("demo.card2")} </Card>
        <Card backgroundColor='#1F724A' height='50px' borderRadius='5px'> {t("demo.card3")} </Card>
      </Grid>
      <Divider />

      <h2>{t("demo.card")}</h2>
      <Card padding="24px" shadow borderRadius="12px" backgroundColor='black' positionType='Relative'>
        <h3>{t("demo.card_title")}</h3>
        <p>{t("demo.card_content")}</p>
      </Card>

      <h2>{t("demo.image_card")}</h2>
      <Row gap="16px" justifyContent="start">
        <ImageCard 
          image="/Images/image1.png" 
          alt={t("demo.sample_image1")} 
          width="150px" 
          height="150px"
          borderRadius="10px"
        />
        <ImageCard 
          image="/Images/image3.png" 
          alt={t("demo.sample_image3")} 
          width="150px" 
          height="150px" 
          borderRadius="10px"
        />
        <ImageCard 
          alt={t("demo.fallback_icon")} 
          width="150px" 
          height="150px" 
          rounded
        />
      </Row>
      <Divider />

      <h2>{t("demo.audio")}</h2>
      <Card padding="16px" backgroundColor="#f0f0f0" borderRadius="8px">
        <Text variant="body1" bold>{t("demo.sample_audio")}</Text>
        <Spacer size="sm" />
        <AudioPlayer
          audioURL="/Audio/Gorillaz_-_Feel_Good_Inc.__Official_Video_(140).m4a"
          isActive={activeAudioIndex === 0}
          onActivate={() => handleAudioActivate(0)}
        />
      </Card>
      <Divider />

      <h2>{t("demo.waveform")}</h2>
      <Card padding="16px" backgroundColor="#f0f0f0" borderRadius="8px">
        <Text variant="body1" bold>{t("demo.sample_waveform")}</Text>
        <Spacer size="sm" />
        <div style={{ width: '100%' }}>
          <WaveformPlayer
            audioUrl="/Audio/Gorillaz_-_Feel_Good_Inc.__Official_Video_(140).m4a"
            isPlaying={activeAudioIndex === 1}
            onTogglePlay={(playing) => {
              if (playing) setActiveAudioIndex(1);
              else setActiveAudioIndex(null);
            }}
            onReady={(duration) => {
              setAudioDurations(prev => ({ ...prev, 1: duration }));
            }}
            onTimeUpdate={(time) => {
              setAudioTimes(prev => ({ ...prev, 1: time }));
            }}
          />
        </div>
        <Spacer size="sm" />
        <Text variant="caption1">
          {formatTime(audioTimes[1] || 0)} / {formatTime(audioDurations[1] || 0)}
        </Text>
      </Card>
      <Divider />

      <h2>{t("demo.person_card")}</h2>
      <Row alignItems='center' padding="0px" gap="1rem" margin='0px'>
        <PersonCard
          variant="root"
          name="Vishanti"
          sex="F"
          birthDate="01/01/1880"
          profileImage="/Images/image5.jpg"
          onClick={() => setSidebarOpen(true)}
          onAdd={() => { }}
        />

        <PersonCard
          variant="dead"
          name="Vishanti Vlad Tepes"
          sex="F"
          role='admin'
          birthDate="01/01/1880"
          deathDate="01/01/1950"
          profileImage="/Images/image6.jpg"
          onClick={() => setSidebarOpen(false)}
          onAdd={() => { }}
        />

        <PersonCard
          variant="directline"
          name="Vishanti Vlad Tepes"
          sex="F"
          role='moderator'
          birthDate="01/01/1880"
          profileImage="/Images/image7.jpg"
          onClick={() => setSidebarOpen(true)}
          onAdd={() => { }}
        />

        <PersonCard
          variant="spouce"
          role='editor'
          name="Vishanti Vlad Tepes"
          sex="F"
          birthDate="01/01/1880"
          profileImage="/Images/image8.jpg"
          onClick={() => setSidebarOpen(false)}
          onAdd={() => { }}
        />

        <PersonCardHorizontal
          variant="spouce"
          role='editor'
          name="Vishanti Vlad Tepes"
          sex="F"
          birthDate="01/01/1880"
          profileImage="/Images/image8.jpg"
          onClick={() => setSidebarOpen(false)}
          onAdd={() => { }}
        />
      </Row>


      <Divider />
      <h2>Reusable Modals</h2>
      <Row padding='0px' margin='0px' fitContent>
        <Button fullWidth onClick={() => setIsConfirmationModalOpen(true)}>
          Open Confirmation Modal
        </Button>
        <ConfirmationModal
          isOpen={isConfirmationModalOpen}
          onClose={() => setIsConfirmationModalOpen(false)}
          onConfirm={(rememberChoice) => alert(`Confirmed! Remember choice: ${rememberChoice}`)}
          title="Confirm action"
          message="Are you sure you want to confirm this action This action cannot be undone."
          confirmText="Confirm"
          cancelText="Cancel"
          confirmVariant="primary"
        />
        <Button fullWidth onClick={() => setIsWarningModalOpen(true)}>
          Open Warning Modal
        </Button>
        <WarningModal
          isOpen={isWarningModalOpen}
          onClose={() => setIsWarningModalOpen(false)}
          onConfirm={(dontRemindMe) => alert(`Proceed! Don't remind me: ${dontRemindMe}`)}
          title="Warning"
          message="This action may have consequences. Are you sure you want to proceed?"
          confirmText="Proceed"
          cancelText="Cancel"
          confirmVariant="warning"
        />
        <Button fullWidth onClick={() => setIsErrorModalOpen(true)}>
          Open Error Modal
        </Button>
        <ErrorModal
          isOpen={isErrorModalOpen}
          onClose={() => setIsErrorModalOpen(false)}
          title="Error"
          message="An error occurred. Please try again."
          confirmText="OK"
          confirmVariant="danger"
        />
        <Button fullWidth onClick={() => setIsInfoModalOpen(true)}>
          Open Info Modal
        </Button>
        <InfoModal
          isOpen={isInfoModalOpen}
          onClose={() => setIsInfoModalOpen(false)}
          title="Information"
          message="This is an informational message."
          confirmText="OK"
          confirmVariant="primary"
        />
      </Row>

      <Divider />
      <h2>Toast Messages</h2>
      <Row padding='0px' margin='0px' fitContent>
        <Button fullWidth onClick={() => addToast('This is a success message!', 'success')}>
          Show Success Toast
        </Button>
        <Button fullWidth onClick={() => addToast('This is an error message!', 'error')}>
          Show Error Toast
        </Button>
        <Button fullWidth onClick={() => addToast('This is a warning message!', 'warning')}>
          Show Warning Toast
        </Button>
        <Button fullWidth onClick={() => addToast('This is an info message!', 'info')}>
          Show Info Toast
        </Button>
        <Button fullWidth onClick={() => addToast(
          <div style={{
            background: "white",
            padding: "10px 15px",
            borderRadius: "6px",
            border: "1px solid #ddd",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
          }}>
            <strong>Uploading...</strong>
            <progress value="30" max="100"></progress>
          </div>,
          "blank"
        )}>
          Show Blank/Custom Toast
        </Button>
      </Row>

    </div>
  );
};

export default ComponentDemo;

