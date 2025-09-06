
import { useClerk } from "@clerk/nextjs"

import { trpc } from "@/trpc/client";
import { toast } from "sonner";

interface UseSubscriptionProps {
    userId: string,
    isSubscribed: boolean;
    fromVideoId?: string;
    //Added
    onSuccess?: (newStatus: boolean) => void; // optional callback
}

export const useSubscription = ({
    userId,
    isSubscribed,
    fromVideoId,
    onSuccess,
}: UseSubscriptionProps) => {
    const clerk = useClerk();
    const utils = trpc.useUtils();

    const subscribe = trpc.subscriptions.create.useMutation({
        onSuccess: () => {
            toast.success("Subscribed");
            // TODO: reinvalidate subsriptions.getMany, users.getOne
            if (fromVideoId) {
                utils.videos.getOne.invalidate({ id: fromVideoId })
            }
             if (onSuccess) onSuccess(false); // call callback with new status
        },
        onError: (error) => {
            toast.error("Something went wrong")
            if(error.data?.code ==="UNAUTHORIZED") {
                clerk.openSignIn();
            }
        }
    });

    const unsubscribe = trpc.subscriptions.remove.useMutation({
        onSuccess: () => {
            toast.success("Unsubscribed");
            // TODO: reinvalidate subsriptions.getMany, users.getOne

            if (fromVideoId) {
                utils.videos.getOne.invalidate({ id: fromVideoId })
            }
        },
        onError: (error) => {
            toast.error("Something went wrong")
            if(error.data?.code ==="UNAUTHORIZED") {
                clerk.openSignIn();
            }
        }
    });

    const isPending = subscribe.isPending || unsubscribe.isPending;

    const onClick = () => {
        if(isSubscribed) {
            unsubscribe.mutate({ userId })
        } else {
            subscribe.mutate({ userId})
        }
    }

    return {
        isPending,
        onClick,                                                                                                                           
    };
}