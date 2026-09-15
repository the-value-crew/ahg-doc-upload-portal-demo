import { useEffect } from "react"

function BossWidget() {
    useEffect(() => {
        if (typeof (window as any).DockLink !== "undefined") {
            try {
                const widget = new (window as any).DockLink({
                    container: document.getElementById('link_page_element'),
                    domain: "erc-together-1234567.myintranetapps.com",
                    token: "et-3aa7e2be-c3c3-41ca-a521-546d12184b5c",
                    app: "company/forms",
                    options: {
                        key: "taxstatus"
                    },
                    onSuccess: function (data: any) {
                        console.log('calling onSuccess callback with this data: ', data);
                    },
                    onError: function (data: any) {
                        console.log('calling onError callback with this data: ', data);
                    },
                    onEvent: function (data: any) {
                        console.log('calling onEvent callback with this data: ', data);
                    }
                });

                widget.render();
            } catch (err) {
                console.warn("Could not initialize DockLink widget:", err);
            }
        }
    }, [])

    return <>
        <div id="link_page_element"></div>
    </>
}

export default BossWidget;