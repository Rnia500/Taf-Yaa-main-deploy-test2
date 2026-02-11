import React from "react";
import { useNavigate } from 'react-router-dom';
import { SearchIcon, MicIcon, PlayIcon, Volume2Icon, UsersIcon, TreePine, Languages, Handshake, UserIcon, RefreshCwIcon, NetworkIcon, Users, Plus, ChevronDown, GitFork, Wifi, Globe, Globe2 } from 'lucide-react';
import PageFrame from "../layout/containers/PageFrame";
import DefaultNavbar from "../components/navbar/DefaultNavbar";
import Button from "../components/Button";
import useModalStore from "../store/useModalStore";


const LandingPageHTML = () => {

  const navigate = useNavigate();
  const { openModal } = useModalStore();
    return (
        <div className="relative w-full min-h-screen overflow-x-hidden bg-background-dark text-white">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                {/* Download background image */}
                <img
                    alt="Family tree background"
                    className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
                    src="/Images/background tree.png"
                />
            </div>
            {/* Main Content */}
            <main className="relative z-10">
                {/* Hero Section */}
                <section
                    className="relative min-h-[80vh] flex items-center justify-center text-center bg-cover bg-center"
                    style={{
                        /* Download hero background image */
                        backgroundImage:
                            'linear-gradient(to top, rgba(26, 18, 11, 0.8) 0%, rgba(26, 18, 11, 0.4) 50%, rgba(26, 18, 11, 0.8) 100%), url("/Images/polygamous african family.png")',
                    }}
                >
                    <div className="absolute inset-0 bg-pattern-dark opacity-30"></div>
                    <div className="relative container mx-auto px-6 py-20">
                        <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight drop-shadow-lg">
                            Build Your African Family Tree with Tafyaa
                        </h1>
                        <p className="mt-4 max-w-3xl mx-auto text-base md:text-lg font-light">
                            Discover your roots, connect generations, and celebrate your
                            heritage.
                        </p>
                        <div className="mt-12 flex flex-col items-center gap-6 w-full max-w-3xl mx-auto">
                            <div className="w-full bg-card-dark/80 backdrop-blur-sm p-2 rounded-full flex items-center gap-2 border border-white/20 shadow-lg">
                                <input
                                    className="w-full bg-transparent border-none text-white placeholder-gray-300 focus:ring-0 focus:outline-none text-lg pl-4"
                                    placeholder="Search public family trees by name or clan..."
                                    type="text"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const searchTerm = e.target.value.trim();
                                            if (searchTerm) {
                                                navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
                                            }
                                        }
                                    }}
                                />
                                <button
                                    className="bg-white text-white p-3 rounded-full hover:bg-primary/90 transition-colors flex-shrink-0"
                                    onClick={() => {
                                        const input = document.querySelector('input[placeholder="Search public family trees by name or clan..."]');
                                        const searchTerm = input?.value.trim();
                                        if (searchTerm) {
                                            navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
                                        }
                                    }}
                                >
                                    <SearchIcon size={28} color="#333" />
                                </button>
                            </div>
                            <div className="flex flex-wrap justify-center items-center gap-4">
                                <Button
                                    style={{ borderRadius: '9999px', transition: "all 0.2s ease-in-out" }}
                                    variant="primary"
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                    onClick={() => navigate('/login')}
                                >
                                    Create a Family
                                </Button>
                                <Button
                                    style={{
                                        borderRadius: '9999px',
                                        background: "rgba(255,255,255,0.1)",
                                        backdropFilter: "blur(8px)",
                                        color: "var(--color-gray)",
                                        boxShadow: "0 4px 32px rgba(0,0,0,0.12)",
                                        transition: "all 0.2s ease-in-out"
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = 'rgba(0,255,0,0.15)';
                                        e.currentTarget.style.transform = 'scale(1.02)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                    onClick={() => openModal('joinModal')}
                                >
                                    Join a Family
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
                {/* How It Works Section */}
                <section className="py-20 sm:py-24 bg-transparent relative">
                    <div className="container mx-auto px-6">
                        <div className="text-center max-w-3xl mx-auto">
                            <h2
                                className="text-3xl md:text-4xl font-bold"
                                style={{ color: "var(--color-primary-text)" }}
                            >
                                How It Works
                            </h2>
                            <p className="mt-4 text-base md:text-lg text-gray-600">
                                Embark on your journey of discovery in a few simple steps.
                                Tafyaa makes it easy to build, grow, and explore your family
                                tree.
                            </p>
                        </div>
                        <div className="mt-16 relative">
                            <div
                                className="absolute left-1/2 -translate-x-1/2 top-10 bottom-10 w-1 rounded-full hidden md:block"
                                style={{ background: "var(--color-background)" }}
                            ></div>
                            <div className="space-y-16">
                                {/* Step 1 */}
                                <div className="relative flex flex-col md:flex-row items-center gap-8">
                                    <div className="md:w-1/2 md:pr-12 md:text-right">
                                        <div className="inline-block bg-white  p-6 rounded-xl shadow-lg border border-gray-200">
                                            <h3
                                                className="text-2xl font-bold"
                                                style={{ color: "var(--color-primary1)" }}
                                            >
                                                Create Your Account
                                            </h3>
                                            <p className="mt-2 text-gray-600">
                                                Sign up in seconds. All you need is an email to start your journey into your family's past.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div
                                            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg"
                                            style={{
                                                background: "var(--color-ground)",
                                                color: "var(--color-black)",
                                            }}
                                        >
                                            1
                                        </div>
                                    </div>
                                    <div className="md:w-1/2 md:pl-12">
                                        <img
                                            alt="User signing up on a phone"
                                            className="rounded-xl shadow-lg w-full max-w-sm mx-auto"
                                            src="/Images/ImageStep1.png"
                                        />
                                    </div>
                                </div>
                                {/* Step 2 */}
                                <div className="relative flex flex-col md:flex-row items-center gap-8">
                                    <div className="md:w-1/2 md:pl-12 md:order-2">
                                        <div className="inline-block bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                                            <h3
                                                className="text-2xl font-bold"
                                                style={{ color: "var(--color-primary1)" }}
                                            >
                                                Start Building Your Tree
                                            </h3>
                                            <p className="mt-2 text-gray-600">
                                                Add your parents, grandparents, and other relatives. Our
                                                intuitive interface makes it simple to add family
                                                members and define their relationships.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 md:order-1">
                                        <div
                                            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg"
                                            style={{
                                                background: "var(--color-ground)",
                                                color: "var(--color-black)",
                                            }}
                                        >
                                            2
                                        </div>
                                    </div>
                                    <div className="md:w-1/2 md:pr-12 md:order-0">
                                        {/* Download step 2 image */}
                                        <img
                                            alt="Building a family tree on a tablet"
                                            className="rounded-xl shadow-lg w-full max-w-sm mx-auto"
                                            src="/Images/step2Image.png"
                                        />
                                    </div>
                                </div>
                                {/* Step 3 */}
                                <div className="relative flex flex-col md:flex-row items-center gap-8">
                                    <div className="md:w-1/2 md:pr-12 md:text-right">
                                        <div className="inline-block bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                                            <h3
                                                className="text-2xl font-bold"
                                                style={{ color: "var(--color-primary1)" }}
                                            >
                                                Enrich with Stories & Media
                                            </h3>
                                            <p className="mt-2 text-gray-600">
                                                Bring your ancestors to life by recording oral
                                                histories, uploading photos, and attaching documents.
                                                Preserve precious memories for generations to come.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div
                                            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg"
                                            style={{
                                                background: "var(--color-ground)",
                                                color: "var(--color-black)",
                                            }}
                                        >
                                            3
                                        </div>
                                    </div>
                                    <div className="md:w-1/2 md:pl-12">
                                        {/* Download step 3 image */}
                                        <img
                                            alt="Adding photos and audio to a profile"
                                            className="rounded-xl shadow-lg w-full max-w-sm mx-auto"
                                            src="/Images/step3Image.png"
                                        />
                                    </div>
                                </div>
                                {/* Step 4 */}
                                <div className="relative flex flex-col md:flex-row items-center gap-8">
                                    <div className="md:w-1/2 md:pl-12 md:order-2">
                                        <div className="inline-block bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                                            <h3
                                                className="text-2xl font-bold"
                                                style={{ color: "var(--color-primary1)" }}
                                            >
                                                Collaborate & Discover
                                            </h3>
                                            <p className="mt-2 text-gray-600">
                                                Invite family members to contribute to your tree. Use
                                                our search tools to find relatives and merge trees to
                                                uncover new connections.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 md:order-1">
                                        <div
                                            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg"
                                            style={{
                                                background: "var(--color-ground)",
                                                color: "var(--color-black)",
                                            }}
                                        >
                                            4
                                        </div>
                                    </div>
                                    <div className="md:w-1/2 md:pr-12 md:order-0">
                                        {/* Download step 4 image */}
                                        <img
                                            alt="Connecting with other family trees"
                                            className="rounded-xl shadow-lg w-full max-w-sm mx-auto"
                                            src="/Images/step4Image.png"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* Features Section */}
                <section className="py-20 sm:py-24 bg-transparent">
                    <div className="container mx-auto px-6">
                        <div className="text-center max-w-3xl mx-auto">
                            <h2
                                className="text-3xl md:text-4xl font-bold"
                                style={{ color: "var(--color-primary-text)" }}
                            >
                                Experience Features Built For You
                            </h2>
                            <p className="mt-4 text-base md:text-lg text-gray-600">
                                Tafyaa's unique features are designed to honor and preserve the
                                richness of African family structures and storytelling
                                traditions.
                            </p>
                        </div>
                        <div className="mt-16 space-y-20">
                            {/* Feature 1 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                <div className="md:order-2">
                                    <h3
                                        className="text-2xl font-bold"
                                        style={{ color: "var(--color-primary-text)" }}
                                    >
                                        Record and Preserve Oral Histories
                                    </h3>
                                    <p className="mt-4 text-gray-600">
                                        Capture the voices and stories of your elders. Our audio
                                        recording feature lets you attach precious narratives
                                        directly to family members' profiles, ensuring that your
                                        oral history is never lost.
                                    </p>
                                    <div className="mt-8 p-6 bg-white rounded-xl shadow-xl border border-gray-200b  transition-all duration-300">
                                        {/* Header */}
                                        <div className="flex items-center gap-4 mb-5">
                                            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-primary/10">
                                                <MicIcon size={30} color="black" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-lg text-gray-900 leading-tight">
                                                    Grandma Amina
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    Story of our Village
                                                </p>
                                            </div>
                                        </div>

                                        {/* Audio player section */}
                                        <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-100">
                                            <button style={{ backgroundColor: "var(--color-success-light)", padding: '0.75rem' }} className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white hover:bg-primary/90 transition">
                                                <PlayIcon size={30} color="#333" />
                                            </button>

                                            <div className="flex-1">
                                                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div style={{ backgroundColor: "var(--color-ground)" }} className="absolute  left-0 top-0 h-full w-1/3 rounded-full"></div>
                                                </div>
                                            </div>

                                            <span className="text-xs font-mono text-gray-600 whitespace-nowrap">
                                                1:24 / 4:10
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="md:order-1 flex justify-center relative">
                                    <div className="relative">
                                        <img
                                            alt="Globe"
                                            className="rounded-full shadow-lg w-96 h-96 object-cover"
                                            src="/Images/featureImage1.png"
                                        />
                                        <div className="absolute top-6 right-6 bg-white rounded-full shadow-lg p-3">
                                            <MicIcon size={30} color="#333" />
                                        </div>
                                        <div className="absolute bottom-6 left-6 bg-white rounded-full shadow-lg p-3">
                                            <Volume2Icon size={30} color="#333" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Feature 2 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                <div>
                                    <h3
                                        className="text-2xl font-bold"
                                        style={{ color: "var(--color-primary-text)" }}
                                    >
                                        Embrace Complex Family Structures
                                    </h3>
                                    <p className="mt-4 text-gray-600">
                                        Our platform uniquely supports polygamous marriages,
                                        allowing you to accurately represent your family's true
                                        structure. Connect spouses and children with clarity and
                                        respect for your cultural heritage.
                                    </p>
                                    <div className="mt-8 p-8 bg-gradient-to-br  bg-white  rounded-2xl shadow-xl border border-var(--color-gray) transition-all duration-300 hover:shadow-2xl">
                                        {/* Family header area */}
                                        <div className="flex items-center justify-center p-2 relative">

                                            <div className="relative flex items-center gap-3">
                                                {/* Download feature 2 husband image */}
                                                <img
                                                    src="/Images/featureImage2.png"
                                                    alt="Husband"
                                                    style={{ width: '100%', height: 'auto', borderRadius: '10px', border: '2px solid rgba(0, 123, 255, 0.2)' }}
                                                />
                                            </div>

                                        </div>

                                        {/* Children */}
                                        <div className="mt-2 text-center space-y-4">
                                            <div>
                                                <p className="font-bold text-lg text-gray-700 leading-tight">
                                                    Polygamous family of Mr Tafyaa
                                                </p>

                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="md:order-1 flex justify-center relative">
                                    <div className="relative">
                                        <img
                                            alt="Globe"
                                            className="rounded-full shadow-lg w-96 h-96 object-cover"
                                            src="/Images/polygamous african family.png"
                                        />
                                        <div className="absolute top-6 right-6 bg-white rounded-full shadow-lg p-3">
                                            <UsersIcon size={30} color="#333" />
                                        </div>
                                        <div className="absolute bottom-6 left-6 bg-white rounded-full shadow-lg p-3">
                                            <TreePine size={30} color="#333" />
                                        </div>
                                    </div>
                                </div>


                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                <div className="md:order-2">
                                    <h3
                                        className="text-3xl md:text-4xl font-bold"
                                        style={{ color: "var(--color-primary-text)" }}
                                    >
                                        Find Relatives Across the Globe
                                    </h3>
                                    <p className="mt-4 text-base md:text-lg text-gray-600">
                                        Discover connections you never knew existed. Our tree
                                        searching feature helps you find relatives who are also
                                        building their family trees on Tafyaa, bridging continents
                                        and generations.
                                    </p>
                                    <div
                                        className="mt-8 p-6 bg-white rounded-xl shadow-lg border border-gray-200"
                                        style={{ maxWidth: "480px" }}
                                    >
                                        <div className="flex items-center gap-2 mb-4">
                                            <input
                                                className="flex-1 bg-gray-100 border-none rounded-full px-4 py-3 text-base focus:ring-0"
                                                placeholder="Search by name, location, or clan..."
                                                type="text"
                                            />
                                            <button className="bg-gray-200 text-white p-3 rounded-full hover:bg-primary/90 transition-colors flex-shrink-0">
                                                <SearchIcon size={28} color="#333" />
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3 bg-primary/5 rounded-lg px-4 py-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <UserIcon size={20} color="#333" />
                                                </div>
                                                <div>
                                                    <span
                                                        className="font-bold"
                                                        style={{ color: "var(--color-primary1)" }}
                                                    >
                                                        Juma Okoro
                                                    </span>
                                                    <div className="text-xs text-gray-500">
                                                        Nairobi, Kenya
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 bg-primary/5 rounded-lg px-4 py-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <UserIcon size={20} color="#333" />
                                                </div>
                                                <div>
                                                    <span
                                                        className="font-bold"
                                                        style={{ color: "var(--color-primary1)" }}
                                                    >
                                                        Adama Faye
                                                    </span>
                                                    <div className="text-xs text-gray-500">
                                                        London, UK
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/*feature 3*/}
                                <div className="md:order-1 flex justify-center relative">
                                    <div className="relative">
                                        <img
                                            alt="Globe"
                                            className="rounded-full shadow-lg w-96 h-96 object-cover"
                                            src="/Images/featureImage3.png"
                                        />
                                        <div className="absolute top-6 right-6 bg-white rounded-full shadow-lg p-3">
                                            <RefreshCwIcon size={30} color="#333" />
                                        </div>
                                        <div className="absolute bottom-6 left-6 bg-white rounded-full shadow-lg p-3">
                                            <Globe2 size={30} color="#333" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Feature 4 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                <div>
                                    <h3
                                        className="text-3xl md:text-4xl font-bold"
                                        style={{ color: "var(--color-primary-text)" }}
                                    >
                                        Join and Integrate Trees
                                    </h3>
                                    <p className="mt-4 text-base md:text-lg text-gray-600">
                                        Collaborate with family members to build a more complete
                                        picture of your heritage. Seamlessly join your tree with
                                        others and integrate branches to get closer to your roots.
                                    </p>
                                    <div className="mt-8 p-6 bg-white rounded-xl shadow-lg flex items-center gap-6 border border-gray-200">
                                        <div className="flex items-center justify-center gap-8 w-full">
                                            <div className="flex flex-col items-center">
                                                <img
                                                    src="/Images/image1.png"
                                                    alt="Your Tree"
                                                    className="w-14 h-14 rounded-full border-4 border-primary/20"
                                                />
                                                <span
                                                    className="text-xs font-bold mt-2"
                                                    style={{ color: "var(--color-primary-text)" }}
                                                >
                                                    Your Tree
                                                </span>
                                            </div>
                                            <span
                                                className="mx-2 text-2xl font-bold"
                                                style={{ color: "var(--color-primary1)" }}
                                            >
                                                +
                                            </span>
                                            <div className="flex flex-col items-center">
                                                <img
                                                    src="/Images/image2.png"
                                                    alt="Cousin's Tree"
                                                    className="w-14 h-14 rounded-full border-4 border-primary/20"
                                                />
                                                <span
                                                    className="text-xs font-bold mt-2"
                                                    style={{ color: "var(--color-primary-text)" }}
                                                >
                                                    Cousin's Tree
                                                </span>
                                            </div>
                                            <span
                                                className="mx-2 text-2xl font-bold"
                                                style={{ color: "var(--color-primary1)" }}
                                            >
                                                &rarr;
                                            </span>
                                            <div className="flex flex-col items-center">
                                                <span
                                                    className="material-symbols-outlined text-4xl"
                                                    style={{ color: "var(--color-primary1)" }}
                                                >
                                                    <GitFork size={40} />
                                                </span>
                                                <span
                                                    className="text-xs font-bold mt-2"
                                                    style={{ color: "var(--color-primary1)" }}
                                                >
                                                    Combined Tree
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-center relative">
                                    <div className="relative">
                                        <img
                                            alt="People around tree"
                                            className="rounded-full shadow-lg w-96 h-96 object-cover"
                                            src="/Images/featureImage4.png"
                                        />
                                        <div className="absolute top-6 right-6 bg-white rounded-full shadow-lg p-3">
                                            <span className="material-symbols-outlined text-primary text-2xl">
                                                <Plus size={30} color="#333" />
                                            </span>
                                        </div>
                                        <div className="absolute bottom-6 left-6 bg-white rounded-full shadow-lg p-3">
                                            <span className="material-symbols-outlined text-primary text-2xl">
                                                <Users size={30} color="#333" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Feature 5 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                <div className="md:order-2">
                                    <h3
                                        className="text-3xl md:text-4xl font-bold"
                                        style={{ color: "var(--color-primary-text)" }}
                                    >
                                        Switch to Local & Mother Languages
                                    </h3>
                                    <p className="mt-4 text-base md:text-lg text-gray-600">
                                        Navigate the app in the language of your heart. Tafyaa
                                        supports numerous African languages, making it accessible
                                        and user-friendly for elders and family members who are more
                                        comfortable with their mother tongue.
                                    </p>
                                    <div
                                        className="mt-8 p-6 bg-white rounded-xl shadow-lg border border-gray-200"
                                        style={{ maxWidth: "480px" }}
                                    >
                                        <div className="w-full flex items-center bg-gray-100 justify-between p-4 bg-gray-100b rounded-lg">
                                            <span className="font-semibold text-gray-800">
                                                Select Language
                                            </span>
                                            <span className="material-symbols-outlined text-primary text-2xl">
                                                <ChevronDown size={30} color="#333" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="md:order-1 flex justify-center relative">
                                    <div className="relative">
                                        <img
                                            alt="Language switcher"
                                            className="rounded-full shadow-lg w-96 h-96 object-cover"
                                            src="/Images/featureImage5.png"
                                        />
                                        <div className="absolute top-6 left-6 bg-white rounded-full shadow-lg p-3">
                                            <span className="material-symbols-outlined text-primary text-2xl">
                                                <Languages size={30} color="#333" />
                                            </span>
                                        </div>
                                        <div className="absolute bottom-6 right-6 bg-white rounded-full shadow-lg p-3">
                                            <span className="material-symbols-outlined text-primary text-2xl">
                                                <Handshake size={30} color="#333" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* Testimonials Section */}
                <section className="py-20 sm:py-24 bg-primary/5">
                    <div className="container mx-auto px-6">
                        <div className="text-center max-w-3xl mx-auto">
                            <h2
                                className="text-3xl md:text-4xl font-bold"
                                style={{ color: "var(--color-primary-text)" }}
                            >
                                What Our Users Are Saying
                            </h2>
                            <p className="mt-4 text-base md:text-lg text-gray-600">
                                Hear from people who have reconnected with their roots using
                                Tafyaa.
                            </p>
                        </div>
                        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col justify-between border border-gray-200">
                                <div>
                                    <p className="text-gray-600">
                                        "Tafyaa helped me finally document our family's oral
                                        history. Hearing my grandmother's voice telling stories is
                                        priceless. This app is a gift to our generation."
                                    </p>
                                </div>
                                <div className="mt-6 flex items-center gap-4">
                                    {/* Download testimonial 1 image */}
                                    <img
                                        alt="User photo"
                                        className="w-12 h-12 rounded-full object-cover"
                                        src="/Images/image1.png"
                                    />
                                    <div>
                                        <p
                                            className="font-bold"
                                            style={{ color: "var(--color-primary1)" }}
                                        >
                                            Amina Yusuf
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Lagos, Nigeria
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col justify-between border border-gray-200">
                                <div>
                                    <p className="text-gray-600">
                                        "The polygamous marriage feature is revolutionary! It
                                        accurately reflects my family structure, which no other app
                                        could do. Thank you for understanding our culture."
                                    </p>
                                </div>
                                <div className="mt-6 flex items-center gap-4">
                                    {/* Download testimonial 2 image */}
                                    <img
                                        alt="User photo"
                                        className="w-12 h-12 rounded-full object-cover"
                                        src="/Images/image2.png"
                                    />
                                    <div>
                                        <p
                                            className="font-bold"
                                            style={{ color: "var(--color-primary1)" }}
                                        >
                                            Kwame Owusu
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Accra, Ghana
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col justify-between border border-gray-200">
                                <div>
                                    <p className="text-gray-600">
                                        "I connected with relatives I never knew I had. Tafyaa made
                                        it easy to build our family tree and share it with everyone.
                                        It's brought us closer."
                                    </p>
                                </div>
                                <div className="mt-6 flex items-center gap-4">
                                    {/* Download testimonial 3 image */}
                                    <img
                                        alt="User photo"
                                        className="w-12 h-12 rounded-full object-cover"
                                        src="/Images/image3.png"
                                    />
                                    <div>
                                        <p
                                            className="font-bold"
                                            style={{ color: "var(--color-primary1)" }}
                                        >
                                            Fatima Diallo
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Dakar, Senegal
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Call-to-Action Section */}
                <section className="bg-white py-20 sm:py-24">
                    <div
                        className="container mx-auto px-6 text-center"
                        style={{ color: "var(--color-primary-text)" }}
                    >
                        <h2
                            className="text-3xl md:text-4xl font-bold"
                            style={{ color: "var(--color-primary-text)" }}
                        >
                            Start Building Your Family Tree Today
                        </h2>
                        <p
                            className="mt-4 max-w-2xl mx-auto text-base md:text-lg"
                            style={{ color: "var(--color-primary-text)" }}
                        >
                            Join thousands of families connecting with their heritage. Get
                            started with Tafyaa and begin your journey of discovery.
                        </p>
                        <div className="mt-8 flex flex-wrap justify-center items-center gap-4">
                            <Button
                                style={{ borderRadius: "9999px", transition: "all 0.2s ease-in-out" }}
                                variant="primary"
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                onClick={() => navigate('/login')}

                            >
                                Create a Family
                            </Button>
                            <Button
                                style={{ borderRadius: "9999px", transition: "all 0.2s ease-in-out" }}
                                variant="secondary"
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                onClick={() => openModal('joinModal')}
                            >
                                Join a family
                            </Button>
                        </div>
                    </div>
                </section>
            </main>
            {/* Footer */}
            <footer className="bg-background-light  border-t border-primary/20  relative z-10">
                <div className="container mx-auto px-6 py-8">
                    <div
                        className="flex flex-col md:flex-row items-center justify-between gap-6"
                        style={{ color: "var(--color-primary-text)" }}
                    >
                        <div className="flex flex-wrap justify-center gap-6">
                            <a
                                className="text-sm hover:text-primary transition-colors"
                                style={{ color: "var(--color-primary-text)" }}
                                href="#"
                            >
                                Privacy Policy
                            </a>
                            <a
                                className="text-sm hover:text-primary transition-colors"
                                style={{ color: "var(--color-primary-text)" }}
                                href="#"
                            >
                                Terms of Service
                            </a>
                            <a
                                className="text-sm hover:text-primary transition-colors"
                                style={{ color: "var(--color-primary-text)" }}
                                href="#"
                            >
                                Contact Us
                            </a>
                        </div>
                        <p
                            className="text-sm"
                            style={{ color: "var(--color-primary-text)" }}
                        >
                            © 2025 4Tech. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default function LandingPage() {
    return (
        <PageFrame topbar={<DefaultNavbar />}>
            <LandingPageHTML />
        </PageFrame>
    );
}