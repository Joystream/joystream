import React from "react";
import { css } from "@emotion/core";
import { ChannelPreview, Gallery } from "@joystream/components";

const channels = [
	{
		channel: "Channel Name",
		views: "334k",
		channelAvatar:
			"https://s3-alpha-sig.figma.com/img/6751/0287/aac9acd027772e345affcf7aa6b55558?Expires=1594598400&Signature=fvbTsTzpk~ZCOnkgIH0ir-Mogd0Z4YI7J1sviV2sEnDn3SvlYEV~iW2sJs65a73cbaKTam3ZE4er~nXogGBQvEfqcQwm7Gv4riTgVKqopFOflM5CZ1xgPb1s6OmlSDXNsqR8Wl6oP~DRt7Dl-fWjmpPj-uk01GCWGKX4QR2zwezPg1zSZxB~xpaxCKnzi8tbTnGfTpDFJCFDQdSu-P3OVR~B~M8v6p-ZODsDHe9OtRwB2YyAi21ac-PFEWPM4Pm0oGVcAkRTV~-MK70bhtF9mSwNaCXS3BhU3~RhlihoJnuVU5aCtoxQ5DkgCSFc9~QE~lDCRRAFIaO-XApXDt97TA__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
	},
	{
		channel: "Channel Name",
		views: "334k",
		channelAvatar:
			"https://s3-alpha-sig.figma.com/img/f853/b9f7/e07227eb3c4e6312d43372578cdea8f1?Expires=1594598400&Signature=AhF3IwhCDhR3aZBnCOVcN2Vj-fTAabElsuAsVT2sAc0Txu3aQz0XiYxEqOrUHhxzGkVr0oXNlcC9WTWlPQfE~rOd~D~E0wTTd5SVMoWtPmX5Uuy4ohRfUdBx0FifTzEN~e5H0cuXOyYd01TmMWWkreVYMxJ0mRVPjqS9sYbCSvaxyQY5v8fpa69ATGkrBx4W96HcPGJeTJZEJEawJbVIHbAXgrJKlCCkD3oRjur00Nw~v~WKDyPW1nb0BSSUe7NeRaV4qIztPyAorQVBO4iFaVDeS~IeTRPG4T4trZoRJtpF9jTfBDd~0dFWbvJ2CeavaClhC5bY8fYlIcfRjddTyA__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
	},
	{
		channel: "Channel Name",
		views: "334k",
		channelAvatar:
			"https://s3-alpha-sig.figma.com/img/57d7/47bd/e40e51d45107656c92b3c9d982e76c6e?Expires=1594598400&Signature=SZwkYLVqsT9d2UPzQKA0whK2o4590Lf15eipFvdpJNf~JtrNWSXJKfgpcDp-APKSaPy8-ycv-cDyOMtog7zTB5Ygh8Rag0pEumJQgXSPBw6e~DmE1lPlLED-cmzrEOnCYVaa6m6zjln57K6jP0yusSwZTNly3moD-9iIRrR4fP9ZNBVHVpW~TSeyd7hL4r26s4NNVNkWrFw8~vrz-byARTPo5vyTqvPkaX1QL~uNjfU5x~--BAGb6meuPBMNeolFbUWj2HsV908N0xZdcMLfZ92-Ze1IVq4wc~fuIitcDZ7z6LQSVf5QuMef4X9QYR7BDvXT8iq-NeOGYyPsGpZ3Jg__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
	},
	{
		channel: "Channel Name",
		views: "334k",
		channelAvatar:
			"https://s3-alpha-sig.figma.com/img/3408/13d0/9b77ae604c2991a867734c9bc7511bdb?Expires=1594598400&Signature=WfF06NNeSSMn5O~NKhufgbJubM-9CqIyPCwwP4nGY0hxPGbQ4aoauZSdNG8XZtxuFtcdxvcapt4Y~mqgbDNIJsj7pRnWueEptTGSJEto99SNxNjgZpfz7BM-T-48D3PfsYWwKnthOssm8eLTIVbDODM4VRfTRS~G94olA9g8VxAf9YLW6aorO01nrtoNS~3~O~sGVVnC2OZeCcEba0eQWPdVM94nvk1HDRe08WtXLGoi3E3gAr5wo4E48LtskEO0ycguLlzPGeSS-1Z7XqiGnhQ1y90yAk4OLWJh1HYsgNromK-OSBLU0Dpm3CYWzjYn29OiLC9N9ypudQDjnatkUg__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
	},
	{
		channel: "Channel Name",
		views: "334k",
		channelAvatar:
			"https://s3-alpha-sig.figma.com/img/dff3/9515/5c27afa40752cfa517b4d1a67b52819d?Expires=1594598400&Signature=VuAo23WQ1xnIPVqpCohfQbjXhOrKo9JZmuBd~EpyHf83PhzrIUrkEQke8QOGiKJuGQ-yw-MVa1ec3Xv-35x9Lh1QSkRIc6oQlSxbuZ3Enxg106xflm9ykurtYTF7DXg8LCLqRcl1sMNPFtkoPLz92uHmaDBqr6DU7f6mFY1VxG85bT1nWHX4TEtC~Nc6qr07Rd1PjFCodt7QcDpkQSjjbcSijjDtAcnzeGWaO9mWJCvxapsxUC43j4i7fDA8GyMXl2bnfTQrSXGcEXvapwIblxU3goqWbjrjGoN72C2shxaqLp-Xmhc7r-p4wTvDVfgk9XHZ7ytci~hkPQA2qvZAew__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
	},
	{
		channel: "Channel Name",
		views: "334k",
		channelAvatar:
			"https://s3-alpha-sig.figma.com/img/f964/ea3d/0c500a4a50470a935ff6bee32ee0731a?Expires=1594598400&Signature=dBOZ0VVyfgxZ~VzH6jpeF4vCWROEGxr6QtOyM8X5kCtvvhvJfd2KRxO8iyVea9ZDIYo7VnDh4IngE3yW040dRFdQuVEKkqZC8aLE8pzXkgqdNlzANAVSnrHYW~Y-3xtLBA3I9dr5EPNasH37ZjFyCYvXjgjXvOpL9-Ji5aHtkDOUN-KCbh6ETJSoQOt~uytRcXoYscnKHPUykRpZVvsPtLUojOqJfCfS0u5sGyqLEEPKgSHt3Q00vHSe5fr~GAy3JbzZ6lEETbFu0iS05RxKDC44ojql0ZP1RkX5BvIxXQ6CEjF2GaRXzV81k7QUAPbs3ZR2Ess2Lmd1NHlqt2rcbg__&Key-Pair-Id=APKAINTVSUGEWH5XD5UA",
	},
];

channels.push(...channels);

type ChannelGalleryProps = {
	title: string;
	action: string;
};

const ChannelGallery: React.FC<Partial<ChannelGalleryProps>> = ({ title, action }) => (
	<Gallery title={title} action={action}>
		{channels.map((chan) => (
			<ChannelPreview
				channel={chan.channel}
				channelAvatar={chan.channelAvatar}
				key={chan.channel}
				views={chan.views}
				outerContainerCss={css`
					margin-right: 1.5rem;
				`}
			/>
		))}
	</Gallery>
);

export default ChannelGallery;
