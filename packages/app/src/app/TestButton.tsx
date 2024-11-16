"use client";

import { main } from "./test";

export default function TestButton() {
    return <button onClick={() => main()}>Test</button>;
}
