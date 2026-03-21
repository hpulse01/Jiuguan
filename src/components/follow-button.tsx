"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface FollowButtonProps {
  username: string;
  initialIsFollowing: boolean;
}

export function FollowButton({ username, initialIsFollowing }: FollowButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, startTransition] = useTransition();
  const [isHovered, setIsHovered] = useState(false);

  function handleClick() {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    const previousState = isFollowing;
    setIsFollowing(!isFollowing);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/users/${username}/follow`, {
          method: "POST",
        });

        if (!res.ok) {
          setIsFollowing(previousState);
        }
      } catch {
        setIsFollowing(previousState);
      }
    });
  }

  if (isFollowing) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isPending}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={
          isHovered
            ? "border-red-800 text-red-400 hover:bg-red-950/50 hover:text-red-400"
            : "border-stone-600 text-stone-300"
        }
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
        ) : isHovered ? (
          <UserPlus className="h-4 w-4 mr-1.5" />
        ) : (
          <UserCheck className="h-4 w-4 mr-1.5" />
        )}
        {isHovered ? "取消关注" : "已关注"}
      </Button>
    );
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
      ) : (
        <UserPlus className="h-4 w-4 mr-1.5" />
      )}
      关注
    </Button>
  );
}
